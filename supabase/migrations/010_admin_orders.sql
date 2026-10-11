-- =====================================================================
-- 010_admin_orders.sql — the owner manages orders (build step 7)
-- Run ONCE in Supabase → SQL Editor, after 009.
--
--   1. admin_set_order_status()  — verify payment, packed, shipped (courier +
--                                   tracking no.), delivered, returns/exchanges,
--                                   cancel (gives reserved stock back)
--   2. admin_reject_payment()    — "payment not found": the customer can enter
--                                   a corrected UTR, stock stays reserved
--   3. submit_utr() now also works after a rejected payment
--
-- Every change is checked with is_admin() and written to admin_activity_log.
-- Orders still cannot be edited directly (002 gives SELECT only).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. admin_set_order_status(order, new status, courier, tracking no., note)
--    Allowed moves:
--      payment_pending    → payment_verified (needs a UTR), cancelled
--      payment_verified   → packed, cancelled
--      packed             → shipped (courier + tracking no.), cancelled
--      shipped            → delivered
--      delivered          → return_requested, exchange_requested
--      return_requested   → returned, delivered (request closed)
--      exchange_requested → shipped (replacement sent), delivered (request closed)
-- ---------------------------------------------------------------------
create function public.admin_set_order_status(
  p_order_id uuid,
  p_status   text,
  p_courier  text default null,
  p_tracking text default null,
  p_note     text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order   public.orders;
  v_allowed text[];
  v_courier text := nullif(btrim(coalesce(p_courier, '')), '');
  v_track   text := nullif(btrim(coalesce(p_tracking, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Only admins can change orders' using errcode = '42501';
  end if;
  if char_length(p_note) > 300 then
    raise exception 'Note is too long (max 300 characters)';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  v_allowed := case v_order.status
    when 'payment_pending'    then array['payment_verified', 'cancelled']
    when 'payment_verified'   then array['packed', 'cancelled']
    when 'packed'             then array['shipped', 'cancelled']
    when 'shipped'            then array['delivered']
    when 'delivered'          then array['return_requested', 'exchange_requested']
    when 'return_requested'   then array['returned', 'delivered']
    when 'exchange_requested' then array['shipped', 'delivered']
    else array[]::text[]
  end;
  if p_status is null or not (p_status = any (v_allowed)) then
    raise exception 'An order that is "%" cannot be changed to "%"', v_order.status, coalesce(p_status, '');
  end if;

  if p_status = 'payment_verified' and v_order.upi_utr is null then
    raise exception 'The customer has not entered a UTR yet';
  end if;
  if p_status = 'shipped' then
    if v_courier is null or v_track is null then
      raise exception 'Enter the courier name and tracking number';
    end if;
    if char_length(v_courier) > 60 or char_length(v_track) > 60 then
      raise exception 'Courier and tracking number must be at most 60 characters';
    end if;
  end if;

  update public.orders
     set status         = p_status,
         payment_status = case when p_status = 'payment_verified' then 'verified' else payment_status end,
         courier        = case when p_status = 'shipped' then v_courier else courier end,
         tracking_no    = case when p_status = 'shipped' then v_track else tracking_no end
   where id = p_order_id;

  if p_status = 'cancelled' then
    perform public.restore_order_stock(p_order_id, 'Order ' || v_order.order_no || ' cancelled by shop');
  end if;

  insert into public.admin_activity_log (admin_id, action, entity, entity_id, details)
  values (auth.uid(), 'order_' || p_status, 'orders', p_order_id::text,
          jsonb_strip_nulls(jsonb_build_object(
            'order_no', v_order.order_no, 'from', v_order.status, 'to', p_status,
            'courier', v_courier, 'tracking_no', v_track, 'note', p_note)));
end;
$$;
revoke execute on function public.admin_set_order_status(uuid, text, text, text, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 2. admin_reject_payment(order, note): the UTR did not match a payment.
--    Order stays open; the customer sees "payment not found" and can enter
--    a corrected UTR or WhatsApp a screenshot. To close it, cancel the order.
-- ---------------------------------------------------------------------
create function public.admin_reject_payment(p_order_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if not public.is_admin() then
    raise exception 'Only admins can change orders' using errcode = '42501';
  end if;
  if char_length(p_note) > 300 then
    raise exception 'Note is too long (max 300 characters)';
  end if;

  update public.orders
     set payment_status = 'rejected'
   where id = p_order_id and status = 'payment_pending' and payment_status = 'pending'
         and upi_utr is not null
  returning * into v_order;
  if not found then
    raise exception 'Only an order with a UTR that is waiting for checking can be rejected';
  end if;

  insert into public.admin_activity_log (admin_id, action, entity, entity_id, details)
  values (auth.uid(), 'order_payment_rejected', 'orders', p_order_id::text,
          jsonb_strip_nulls(jsonb_build_object('order_no', v_order.order_no, 'utr', v_order.upi_utr, 'note', p_note)));
end;
$$;
revoke execute on function public.admin_reject_payment(uuid, text) from public, anon;
grant execute on function public.admin_reject_payment(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 3. submit_utr(): a customer whose payment was rejected can send a
--    corrected UTR; the order goes back to "being checked".
--    (CREATE OR REPLACE keeps the permissions from 009.)
-- ---------------------------------------------------------------------
create or replace function public.submit_utr(p_order_id uuid, p_utr text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_utr text := regexp_replace(coalesce(p_utr, ''), '\s', '', 'g');
begin
  if v_utr !~ '^[0-9]{12}$' then
    raise exception 'The UTR / UPI reference number has 12 digits';
  end if;

  update public.orders
     set upi_utr = v_utr, payment_status = 'pending'
   where id = p_order_id and user_id = auth.uid()
     and status = 'payment_pending' and payment_status in ('pending', 'rejected');
  if not found then
    raise exception 'This order is not waiting for payment';
  end if;
exception
  when unique_violation then
    raise exception 'This UTR number is already used on another order. Please check it.';
end;
$$;
