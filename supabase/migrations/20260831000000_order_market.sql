-- 주문 당시의 마켓. 내역을 어느 통화·언어로 보여줄지가 여기서 정해진다.
-- 기존 주문은 전부 일본 마켓이었다.
alter table orders add column if not exists market text not null default 'jp'
  check (market in ('jp', 'kr'));

-- 후리가나는 일본에만 있는 개념이다. 한국 주문에는 넣을 값이 없다.
alter table orders alter column recipient_furigana drop not null;

-- 주문 시점의 상품명을 두 언어로 박제한다. 기존 행은 null이라
-- 표시할 때 일본어로 폴백한다.
alter table order_items add column if not exists product_name_ko text;
