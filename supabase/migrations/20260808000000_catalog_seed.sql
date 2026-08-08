-- Seed data ported from the mock arrays in
-- src/entities/product/model/products.ts and src/entities/look/model/friends.ts.
-- Run once; re-running would duplicate rows (no natural unique key to
-- ON CONFLICT against — this is a one-time historical seed, not idempotent).

insert into brands (name_ja, name_ko) values
  ('hinata', 'hinata'),
  ('mori', 'mori'),
  ('petit', 'petit');

insert into products (
  brand_id, category, name_ja, name_ko, description_ja, description_ko,
  price, list_price, season, is_new, is_best, sold_out, rating, review_count
) values
  ((select id from brands where name_ja = 'hinata'), 'boy-setup', 'くも柄 長袖ロンパース', '구름무늬 긴팔 롬퍼', 'やわらかな綿100%。肌に触れる部分にもこだわった定番ロンパースです。', '부드러운 면 100%. 피부에 닿는 부분까지 신경 쓴 스테디셀러 롬퍼예요.', 2980, 3800, 'aw', true, true, false, 4.8, 132),
  ((select id from brands where name_ja = 'hinata'), 'girl-setup', 'くまさん 半袖ロンパース', '곰돌이 반팔 롬퍼', '夏でも快適なさらり素材。前開きでお着替えらくらく。', '여름에도 쾌적한 산뜻한 소재. 앞트임으로 갈아입히기 편해요.', 2480, 2480, 'ss', false, true, false, 4.7, 210),
  ((select id from brands where name_ja = 'mori'), 'boy-setup', 'ニット風 足つきカバーオール', '니트풍 발싸개 커버올', 'あたたかいニット調。足先まで包んで寒い季節も安心。', '따뜻한 니트 질감. 발끝까지 감싸 추운 계절에도 안심이에요.', 4200, 5200, 'aw', true, false, false, 4.9, 58),
  ((select id from brands where name_ja = 'mori'), 'girl-homewear', 'オーガニック肌着 2枚セット', '오가닉 내의 2매 세트', 'オーガニックコットン使用。デリケートな肌にやさしい定番セット。', '오가닉 코튼 사용. 예민한 피부에 순한 스테디 세트예요.', 1980, 2600, 'all', false, true, false, 4.9, 421),
  ((select id from brands where name_ja = 'hinata'), 'girl-homewear', '短肌着 3枚組', '배냇저고리 3매 세트', '新生児にちょうどいい短肌着。汗をよく吸う綿100%。', '신생아에게 딱 좋은 배냇저고리. 땀 흡수가 좋은 면 100%.', 1580, 1580, 'all', false, false, false, 4.6, 176),
  ((select id from brands where name_ja = 'mori'), 'boy-homewear', 'コンビ肌着 長袖', '콤비 내의 긴팔', 'はだけにくいコンビタイプ。動きが活発な赤ちゃんにも。', '잘 벌어지지 않는 콤비 타입. 활발한 아기에게도 좋아요.', 1280, 1680, 'aw', true, false, false, 4.5, 64),
  ((select id from brands where name_ja = 'petit'), 'girl-top', 'フリル袖 トレーナー', '프릴 소매 맨투맨', 'さりげないフリルがかわいい裏起毛トレーナー。', '은은한 프릴이 사랑스러운 기모 맨투맨이에요.', 2680, 3200, 'aw', true, true, false, 4.7, 89),
  ((select id from brands where name_ja = 'petit'), 'boy-top', 'ボーダー 半袖Tシャツ', '스트라이프 반팔 티셔츠', 'コーデしやすい定番ボーダー。何枚あっても便利。', '코디하기 쉬운 기본 스트라이프. 여러 장 있어도 좋아요.', 1480, 1480, 'ss', false, false, true, 4.4, 143),
  ((select id from brands where name_ja = 'petit'), 'boy-bottom', 'ゆるっと モンキーパンツ', '루즈핏 몽키 팬츠', 'おむつ姿もすっぽり。伸びる素材で動きやすい。', '기저귀도 쏙 감싸는 신축성 좋은 소재로 움직임이 편해요.', 1980, 2400, 'all', false, true, false, 4.8, 201),
  ((select id from brands where name_ja = 'mori'), 'girl-bottom', 'のびのび レギンス', '쭉쭉 레깅스', '重ね着に大活躍。やわらか裏地でチクチクしない。', '레이어드에 딱. 부드러운 안감으로 까슬거리지 않아요.', 1180, 1180, 'all', true, false, false, 4.6, 97),
  ((select id from brands where name_ja = 'mori'), 'boy-top', 'もこもこ フリースジャケット', '몽실 플리스 자켓', '軽くてあたたか。お出かけにも羽織りやすい一枚。', '가볍고 따뜻해요. 외출할 때 걸치기 좋은 한 벌이에요.', 3980, 4800, 'aw', true, true, false, 4.9, 76),
  ((select id from brands where name_ja = 'petit'), 'girl-top', 'リバーシブル ダウンベスト', '리버시블 다운 베스트', '2wayで長く使える。体温調節にも便利なベスト。', '2way로 오래 쓰는 베스트. 체온 조절에도 편리해요.', 4600, 4600, 'aw', false, false, false, 4.7, 52),
  ((select id from brands where name_ja = 'petit'), 'accessory', 'くしゅくしゅ ソックス 3足', '쭈글 양말 3켤레', '脱げにくい設計。パステルカラーの3足セット。', '잘 벗겨지지 않는 설계. 파스텔 컬러 3켤레 세트예요.', 980, 1200, 'all', false, true, false, 4.5, 268),
  ((select id from brands where name_ja = 'hinata'), 'accessory', 'つば付き ベビーハット', '챙 달린 아기 모자', '日差しからやさしく守る、あご紐付きの帽子。', '햇빛을 부드럽게 막아주는 턱끈 달린 모자예요.', 1680, 1680, 'ss', true, false, false, 4.6, 41),
  ((select id from brands where name_ja = 'mori'), 'accessory', 'スタイ 4枚セット', '턱받이 4매 세트', 'よだれをしっかり吸収。かわいい4色セット。', '침을 잘 흡수해요. 사랑스러운 4색 세트.', 1380, 1800, 'all', false, false, false, 4.8, 189),
  ((select id from brands where name_ja = 'mori'), 'gift', '出産祝い ギフトボックス', '출산 축하 기프트 박스', 'ロンパース・スタイ・ソックスを詰めた人気ギフト。ラッピング無料。', '롬퍼·턱받이·양말을 담은 인기 선물세트. 포장 무료예요.', 6800, 8500, 'all', true, true, false, 5.0, 63),
  ((select id from brands where name_ja = 'hinata'), 'gift', '季節の福袋 5点セット', '시즌 럭키백 5종 세트', '何が届くかお楽しみ。おトクな5点入りの福袋です。', '무엇이 올지 기대되는, 알찬 5종 구성 럭키백이에요.', 5000, 9800, 'all', true, false, false, 4.7, 128);

with variant_data(product_name, colors, sizes) as (
  values
    ('くも柄 長袖ロンパース', array['#e9dfd2','#dfe5d9','#f4e2df'], array['50-60','70','80','90','95']),
    ('くまさん 半袖ロンパース', array['#f4e2df','#e9dfd2'], array['50-60','70','80','90','95']),
    ('ニット風 足つきカバーオール', array['#dfe5d9','#e9dfd2','#d9d0c4'], array['50-60','70','80']),
    ('オーガニック肌着 2枚セット', array['#fbf9f6','#f1ebe3'], array['50-60','70','80','90','95']),
    ('短肌着 3枚組', array['#fbf9f6','#f4e2df','#dfe5d9'], array['50-60','70']),
    ('コンビ肌着 長袖', array['#f1ebe3','#dfe5d9'], array['50-60','70','80','90','95']),
    ('フリル袖 トレーナー', array['#f4e2df','#e9dfd2'], array['70','80','90']),
    ('ボーダー 半袖Tシャツ', array['#dfe5d9','#e9dfd2','#f4e2df'], array['70','80','90']),
    ('ゆるっと モンキーパンツ', array['#e9dfd2','#d9d0c4','#dfe5d9'], array['70','80','90']),
    ('のびのび レギンス', array['#d9d0c4','#dfe5d9','#f4e2df'], array['50-60','70','80','90','95']),
    ('もこもこ フリースジャケット', array['#e9dfd2','#dfe5d9'], array['70','80','90']),
    ('リバーシブル ダウンベスト', array['#d9d0c4','#dfe5d9','#f4e2df'], array['70','80','90']),
    ('くしゅくしゅ ソックス 3足', array['#f4e2df','#dfe5d9','#e9dfd2'], array['70','80']),
    ('つば付き ベビーハット', array['#e9dfd2','#dfe5d9'], array['70','80','90']),
    ('スタイ 4枚セット', array['#dfe5d9','#f4e2df','#e9dfd2','#d9d0c4'], array['50-60']),
    ('出産祝い ギフトボックス', array['#f4e2df','#dfe5d9'], array['50-60','70']),
    ('季節の福袋 5点セット', array['#e9dfd2','#dfe5d9','#f4e2df'], array['70','80','90'])
)
insert into product_variants (product_id, color, size, stock)
select p.id, c.color, s.size, 20
from variant_data d
join products p on p.name_ja = d.product_name
cross join lateral unnest(d.colors) as c(color)
cross join lateral unnest(d.sizes) as s(size);

insert into friend_looks (handle, image_src, model_info_ja, model_info_ko) values
  ('@hana_mam', '/friends/look-01.svg', '24ヶ月 / 88cm', '24개월 / 88cm'),
  ('@yuzu.days', '/friends/look-02.svg', '10ヶ月 / 72cm', '10개월 / 72cm'),
  ('@mori_no_ie', '/friends/look-03.svg', '18ヶ月 / 82cm', '18개월 / 82cm'),
  ('@kotoha_style', '/friends/look-04.svg', '6ヶ月 / 66cm', '6개월 / 66cm'),
  ('@sora_to_umi', '/friends/look-05.svg', '30ヶ月 / 92cm', '30개월 / 92cm'),
  ('@rina.baby', '/friends/look-06.svg', '27ヶ月 / 90cm', '27개월 / 90cm'),
  ('@han2bit', '/friends/look-07.svg', '36ヶ月 / 96cm', '36개월 / 96cm'),
  ('@zoopeach', '/friends/look-08.svg', '21ヶ月 / 86cm', '21개월 / 86cm'),
  ('@nagi_0301', '/friends/look-09.svg', '14ヶ月 / 78cm', '14개월 / 78cm'),
  ('@mameco_ie', '/friends/look-10.svg', '8ヶ月 / 70cm', '8개월 / 70cm'),
  ('@tsumugi.log', '/friends/look-11.svg', '33ヶ月 / 94cm', '33개월 / 94cm'),
  ('@baby_aoi', '/friends/look-12.svg', '12ヶ月 / 75cm', '12개월 / 75cm');

with look_product_data(handle, product_name) as (
  values
    ('@hana_mam', 'くも柄 長袖ロンパース'),
    ('@hana_mam', 'くしゅくしゅ ソックス 3足'),
    ('@yuzu.days', 'くまさん 半袖ロンパース'),
    ('@yuzu.days', 'スタイ 4枚セット'),
    ('@mori_no_ie', 'ニット風 足つきカバーオール'),
    ('@mori_no_ie', 'くしゅくしゅ ソックス 3足'),
    ('@kotoha_style', 'オーガニック肌着 2枚セット'),
    ('@sora_to_umi', 'ボーダー 半袖Tシャツ'),
    ('@sora_to_umi', 'ゆるっと モンキーパンツ'),
    ('@sora_to_umi', 'つば付き ベビーハット'),
    ('@rina.baby', 'フリル袖 トレーナー'),
    ('@rina.baby', 'のびのび レギンス'),
    ('@han2bit', 'もこもこ フリースジャケット'),
    ('@han2bit', 'ゆるっと モンキーパンツ'),
    ('@han2bit', 'くしゅくしゅ ソックス 3足'),
    ('@zoopeach', 'リバーシブル ダウンベスト'),
    ('@zoopeach', 'フリル袖 トレーナー'),
    ('@zoopeach', 'のびのび レギンス'),
    ('@nagi_0301', 'コンビ肌着 長袖'),
    ('@nagi_0301', 'くしゅくしゅ ソックス 3足'),
    ('@mameco_ie', '短肌着 3枚組'),
    ('@mameco_ie', 'スタイ 4枚セット'),
    ('@tsumugi.log', 'ボーダー 半袖Tシャツ'),
    ('@tsumugi.log', 'つば付き ベビーハット'),
    ('@baby_aoi', 'コンビ肌着 長袖'),
    ('@baby_aoi', 'のびのび レギンス'),
    ('@baby_aoi', 'くしゅくしゅ ソックス 3足')
)
insert into friend_look_products (friend_look_id, product_id)
select fl.id, p.id
from look_product_data lpd
join friend_looks fl on fl.handle = lpd.handle
join products p on p.name_ja = lpd.product_name;
