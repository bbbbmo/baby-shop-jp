-- 마켓별 가격. 기존 컬럼이 엔화라는 것을 이름에 드러내고 원화를 추가한다.
-- price 하나만 있으면 다음 사람이 "그냥 가격"으로 오해한다.
alter table products rename column price to price_jpy;
alter table products rename column list_price to list_price_jpy;

-- 원화는 nullable이다. 값이 비어 있으면 한국 마켓 카탈로그에서 제외되므로
-- 가격을 정한 상품부터 순서대로 한국 마켓을 열 수 있다.
alter table products add column if not exists price_krw integer;
alter table products add column if not exists list_price_krw integer;
