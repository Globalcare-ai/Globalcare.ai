-- 008_reconcile_arc_escrow.sql
-- One-off data correction. The first Arc milestone release was recorded rounded to
-- cents (0.08) while the contract actually paid 0.084 USDC, which left the DB's
-- "remaining" 0.004 higher than the chain's. A refund of that inflated remainder
-- would revert on-chain with ExceedsRemaining.
--
-- Verified against GlobalCareEscrow 0xaEDAB3d9dA45A5c6262e9AC35Cf01978f8Eb0c15:
--   total 0.42 · released 0.084 · refunded 0 · remaining 0.336 · status active
--
-- The release route now records full precision, so this is not needed again.

update public.escrow
   set released_amount = 0.084
 where id = '2fbf59a6-258c-410d-b668-7ae175e38eb7'
   and released_amount = 0.08;

update public.escrow_milestones
   set amount = 0.084
 where escrow_id = '2fbf59a6-258c-410d-b668-7ae175e38eb7'
   and idx = 1;

-- verify: remaining should read 0.336, matching the contract
select deposited_amount,
       released_amount,
       refunded_amount,
       deposited_amount - released_amount - refunded_amount as remaining
  from public.escrow
 where id = '2fbf59a6-258c-410d-b668-7ae175e38eb7';
