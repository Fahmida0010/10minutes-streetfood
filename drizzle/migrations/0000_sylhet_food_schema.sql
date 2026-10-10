CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  name text NOT NULL,
  name_bn text,
  category text NOT NULL DEFAULT 'restaurant',
  description text,
  address text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  phone text,
  image_url text,
  open_time time NOT NULL DEFAULT '10:00',
  close_time time NOT NULL DEFAULT '22:00',
  price_min integer NOT NULL DEFAULT 50,
  price_max integer NOT NULL DEFAULT 300,
  halal boolean NOT NULL DEFAULT true,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurants TO authenticated;
GRANT ALL ON public.restaurants TO service_role;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Owners add restaurants" ON public.restaurants FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update restaurants" ON public.restaurants FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete restaurants" ON public.restaurants FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  price integer NOT NULL,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view menu" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Owners manage menu" ON public.menu_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title text NOT NULL,
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '1 day'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.deals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view deals" ON public.deals FOR SELECT USING (true);
CREATE POLICY "Owners manage deals" ON public.deals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()));

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT 'Guest',
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text CHECK (char_length(comment) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users write own reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users upload own images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'restaurant-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'restaurant-images' AND (storage.foldername(name))[1] = auth.uid()::text);

INSERT INTO public.restaurants (id, name, name_bn, category, description, address, area, lat, lng, phone, open_time, close_time, price_min, price_max, halal) VALUES
('11111111-0000-0000-0000-000000000001','Panshi Restaurant','পানসী রেস্টুরেন্ট','restaurant','Famous for Sylheti bhorta, rice and fish curry at local prices.','Zindabazar Point','Zindabazar',24.8958,91.8680,'01700000001','08:00','23:30',60,350,true),
('11111111-0000-0000-0000-000000000002','Pach Bhai Restaurant','পাঁচ ভাই রেস্টুরেন্ট','restaurant','Busy local favourite with dozens of bhortas and beef bhuna.','Zindabazar Road','Zindabazar',24.8963,91.8673,'01700000002','08:00','23:00',60,400,true),
('11111111-0000-0000-0000-000000000003','Woondaal King Kebab','উন্দাল কিং কাবাব','restaurant','Kebab, naan and grills, great for dinner.','Zindabazar','Zindabazar',24.8945,91.8697,'01700000003','12:00','23:59',150,800,true),
('11111111-0000-0000-0000-000000000004','Dargah Gate Fuchka Corner','দরগাহ গেট ফুচকা কর্নার','street_food','Crispy fuchka and spicy chotpoti right at Dargah gate.','Dargah Gate','Dargah',24.9002,91.8684,NULL,'15:00','22:30',30,120,true),
('11111111-0000-0000-0000-000000000005','Chowhatta Chotpoti Stall','চৌহাট্টা চটপটি','street_food','Evening street stall: chotpoti, jhalmuri, piyaju.','Chowhatta Circle','Chowhatta',24.8989,91.8664,NULL,'16:00','22:00',20,100,true),
('11111111-0000-0000-0000-000000000006','Hotel Noorjahan Grand Buffet','হোটেল নূরজাহান গ্র্যান্ড','hotel','Hotel restaurant with breakfast and dinner buffet.','Dargah Gate','Dargah',24.9010,91.8695,'01700000006','07:00','23:00',400,1500,true),
('11111111-0000-0000-0000-000000000007','Amberkhana Khichuri House','আম্বরখানা খিচুড়ি ঘর','restaurant','Bhuna khichuri with beef, best on rainy days.','Amberkhana Point','Amberkhana',24.9055,91.8705,'01700000007','07:00','22:00',80,250,true),
('11111111-0000-0000-0000-000000000008','Keane Bridge Seven-Layer Tea','কিন ব্রিজ সাত রঙের চা','street_food','Famous layered tea and snacks by the Surma river.','Near Keane Bridge','Bandar',24.8888,91.8676,NULL,'09:00','23:00',20,80,true),
('11111111-0000-0000-0000-000000000009','Shahi Biriyani Ghor','শাহী বিরিয়ানি ঘর','restaurant','Kacchi and tehari served from big pots.','Bandar Bazar','Bandar',24.8905,91.8665,'01700000009','11:00','22:30',120,350,true),
('11111111-0000-0000-0000-000000000010','Hotel Rose View Cafe','হোটেল রোজ ভিউ ক্যাফে','hotel','Hotel cafe with coffee, pastries and continental food.','Shahjalal Uposhohor','Uposhohor',24.8935,91.8820,'01700000010','07:00','23:00',250,1200,true);

INSERT INTO public.menu_items (restaurant_id, name, price) VALUES
('11111111-0000-0000-0000-000000000001','Rice + 3 Bhorta',90),('11111111-0000-0000-0000-000000000001','Rui Fish Curry',160),('11111111-0000-0000-0000-000000000001','Beef Bhuna',220),
('11111111-0000-0000-0000-000000000002','Bhorta Platter',120),('11111111-0000-0000-0000-000000000002','Chicken Curry',170),('11111111-0000-0000-0000-000000000002','Dal',30),
('11111111-0000-0000-0000-000000000003','Chicken Shik Kebab',180),('11111111-0000-0000-0000-000000000003','Butter Naan',40),('11111111-0000-0000-0000-000000000003','Mutton Chap',350),
('11111111-0000-0000-0000-000000000004','Fuchka (8 pcs)',50),('11111111-0000-0000-0000-000000000004','Chotpoti',60),('11111111-0000-0000-0000-000000000004','Doi Fuchka',80),
('11111111-0000-0000-0000-000000000005','Chotpoti',40),('11111111-0000-0000-0000-000000000005','Jhalmuri',20),('11111111-0000-0000-0000-000000000005','Piyaju (4 pcs)',20),
('11111111-0000-0000-0000-000000000006','Dinner Buffet',1200),('11111111-0000-0000-0000-000000000006','Breakfast Buffet',550),
('11111111-0000-0000-0000-000000000007','Beef Khichuri',180),('11111111-0000-0000-0000-000000000007','Egg Khichuri',100),
('11111111-0000-0000-0000-000000000008','7-Layer Tea',70),('11111111-0000-0000-0000-000000000008','Milk Tea',15),('11111111-0000-0000-0000-000000000008','Singara',10),
('11111111-0000-0000-0000-000000000009','Kacchi Biriyani',280),('11111111-0000-0000-0000-000000000009','Beef Tehari',150),
('11111111-0000-0000-0000-000000000010','Cappuccino',280),('11111111-0000-0000-0000-000000000010','Club Sandwich',420);

INSERT INTO public.deals (restaurant_id, title, ends_at) VALUES
('11111111-0000-0000-0000-000000000004','Buy 2 fuchka plates, get 1 doi fuchka free', now() + interval '30 days'),
('11111111-0000-0000-0000-000000000009','15% off Kacchi after 8pm', now() + interval '30 days'),
('11111111-0000-0000-0000-000000000001','Free borhani with any lunch set', now() + interval '30 days');