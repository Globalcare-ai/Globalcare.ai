-- 007_arc.sql — network-aware payments (Arc Testnet + USDC) alongside the existing
-- Sepolia/ETH records. Purely additive: no existing column or row is touched.

-- which chain + asset a payment/escrow lives on
alter table public.escrow   add column if not exists network       text not null default 'sepolia';
alter table public.escrow   add column if not exists chain_id      integer;
alter table public.escrow   add column if not exists contract_address text;   -- Arc escrow contract
alter table public.escrow   add column if not exists approval_tx_hash text;   -- USDC approve()
alter table public.escrow   add column if not exists amount_raw    numeric;   -- token units (6dp USDC)

alter table public.payments add column if not exists network       text not null default 'sepolia';
alter table public.payments add column if not exists chain_id      integer;
alter table public.payments add column if not exists payment_asset text not null default 'ETH';
alter table public.payments add column if not exists approval_tx_hash text;

-- existing rows are Sepolia/ETH — make that explicit rather than leaving it implied
update public.escrow   set network = 'sepolia', chain_id = 11155111 where chain_id is null;
update public.payments set network = 'sepolia', chain_id = 11155111, payment_asset = coalesce(payment_asset, 'ETH') where chain_id is null;

-- escrow.token already stores 'ETH' | 'USDC'; keep it as the asset column for escrow rows
comment on column public.escrow.network is 'sepolia | arc-testnet';
comment on column public.escrow.token   is 'ETH (sepolia) | USDC (arc-testnet)';
comment on column public.payments.payment_asset is 'ETH | USDC';

create index if not exists escrow_network_idx on public.escrow (network);
