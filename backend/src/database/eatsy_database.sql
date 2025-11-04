-- Create database
CREATE DATABASE eatsy_food;
SHOW DATABASES;

-- User authorization
CREATE USER 'nooba'@'localhost' IDENTIFIED BY 'noobanecon';
GRANT ALL PRIVILEGES ON eatsy_food.* TO 'nooba'@'localhost';
SHOW GRANTS FOR CURRENT_USER;
FLUSH PRIVILEGES;

-- Create Users table
CREATE TABLE Users (
    user_id CHAR(255) PRIMARY KEY,
    fullname CHAR(255),
    address CHAR(255),
    gender ENUM('Male', 'Female', 'Other'),
    date_of_birth DATE,
    password CHAR(255) NOT NULL,
	username CHAR(255),
    type_login ENUM('Standard', 'Google', 'Facebook', 'Apple') NOT NULL,
	email CHAR(255) UNIQUE,
	phone_number CHAR(20) UNIQUE NOT NULL,
	country_code CHAR(10) NOT NULL,
	role ENUM('Admin', 'Customer', 'Owner', 'Employee') DEFAULT 'Customer',
    avatar_path VARCHAR(1000),
    payment_method ENUM('Credit Card', 'Momo', 'Zalo Pay', 'Bank Transfer', 'Cash') DEFAULT 'Cash',
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	last_login DATETIME NULL,
	is_online BOOLEAN DEFAULT TRUE
);

-- Create Customer table
CREATE TABLE Customers (
	customer_id CHAR(255) PRIMARY KEY,
    user_id CHAR(255),
    loyal_points INT CHECK (loyal_points >= 0) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- Create Categories Table
CREATE TABLE Categories (
    category_id CHAR(255) PRIMARY KEY, 
    name VARCHAR(255) NOT NULL UNIQUE, 
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Dishes table
CREATE TABLE Dishes (
    dish_id CHAR(255) PRIMARY KEY,
    category_id CHAR(255),
	thumbnail_path VARCHAR(1000) NOT NULL,
    name CHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    points DECIMAL(2, 1) NOT NULL CHECK (points >= 0 AND points <= 5) DEFAULT 0,
    rate_quantity INT CHECK (rate_quantity >= 0) DEFAULT 0,
    discount_amount DECIMAL(5, 2) NOT NULL CHECK (discount_amount >= 0)  DEFAULT 0,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE CASCADE
);

-- Create OTP table
CREATE TABLE OTP (
    otp_id CHAR(255) PRIMARY KEY, 
    info VARCHAR(255) NOT NULL,
    country_code CHAR(10),
    otp VARCHAR(6) NOT NULL, 
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Reviews table
CREATE TABLE Reviews (
    review_id CHAR(255) PRIMARY KEY,
    user_id CHAR(255),
    dish_id CHAR(255),
    points DECIMAL(2, 1) NOT NULL CHECK (points >= 0 AND points <=5),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (dish_id) REFERENCES Dishes(dish_id)
);

-- Create Carts table
CREATE TABLE Carts (
	cart_id CHAR(255) PRIMARY KEY,
    user_id CHAR(255) UNIQUE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
); 

-- Create Cart Items table
CREATE TABLE CartItems (
	cart_item_id CHAR(255) PRIMARY KEY,
	dish_id CHAR(255),
    cart_id CHAR(255),
    quantity INT NOT NULL CHECK (quantity >= 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY (dish_id) REFERENCES Dishes(dish_id) ON DELETE CASCADE,
    FOREIGN KEY (cart_id) REFERENCES Carts(cart_id) ON DELETE CASCADE
);

-- Create Orders table
CREATE TABLE Orders (
    order_id CHAR(255) PRIMARY KEY,
	user_id CHAR(255),
	quantity INT NOT NULL,
	foods TEXT NOT NULL,
	order_note TEXT,
    order_status CHAR(20) NOT NULL CHECK (order_status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- Create Order Items table
CREATE TABLE OrderItems (
    order_item_id CHAR(255) PRIMARY KEY,
    order_id CHAR(255),
    dish_id CHAR(255),
    quantity INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES Dishes(dish_id) ON DELETE CASCADE
);

-- Create Invoices table
CREATE TABLE Invoices (
    invoice_id CHAR(255) PRIMARY KEY,
    customer_id CHAR(255) NOT NULL, 
    employee_id CHAR(255) NOT NULL,
    shipping_fee DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('Credit Card', 'Momo', 'Zalo Pay', 'Bank Transfer', 'Cash') DEFAULT 'Cash',
    status ENUM('Paid', 'Pending', 'Cancelled') DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Create Invoice Items table
CREATE TABLE InvoiceItems (
    invoice_item_id CHAR(255) PRIMARY KEY, 
    invoice_id CHAR(255) NOT NULL, 
    dish_id CHAR(255) NOT NULL, 
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0), 
    price DECIMAL(10, 2) NOT NULL, 
    FOREIGN KEY (invoice_id) REFERENCES Invoices(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES Dishes(dish_id) ON DELETE CASCADE 
);

-- Create Vouchers table
CREATE TABLE Vouchers (
    voucher_id CHAR(255) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type ENUM('Percentage', 'Amount') NOT NULL, 
    discount_value DECIMAL(10, 2) NOT NULL,
    valid_from DATETIME NOT NULL,
    valid_to DATETIME NOT NULL,
    min_purchase DECIMAL(10, 2) DEFAULT 0,
    number_of_uses INT DEFAULT 0 CHECK (number_of_uses > 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create User Voucher table
CREATE TABLE UserVoucher (
    user_id CHAR(255) NOT NULL,
    voucher_id CHAR(255) NOT NULL,
    used_at DATETIME NULL,
    PRIMARY KEY (user_id, voucher_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (voucher_id) REFERENCES Vouchers(voucher_id)
);

-- ------------------------ TRIGGERS -------------------------------
-- ! Run this in Admin(root) to turn on privilege
SET GLOBAL log_bin_trust_function_creators = 1;

DELIMITER $$

-- Auto generate Categories Id
CREATE TRIGGER insert_categories_id_trigger
BEFORE INSERT ON Categories
FOR EACH ROW
BEGIN
    IF NEW.category_id IS NULL OR NEW.category_id = ''
    THEN
        SET NEW.category_id = UUID();
    END IF;
END$$

-- Auto generate Cart Items Id
CREATE TRIGGER insert_cart_items_id_trigger
BEFORE INSERT ON CartItems
FOR EACH ROW
BEGIN
    IF NEW.cart_item_id IS NULL THEN
        SET NEW.cart_item_id = UUID();
    END IF;
END$$

-- Auto generate Carts Id
CREATE TRIGGER insert_carts_id_trigger
BEFORE INSERT ON Carts
FOR EACH ROW
BEGIN
    IF NEW.cart_id IS NULL THEN
        SET NEW.cart_id = UUID();
    END IF;
END$$

-- Auto generate Customers Id
CREATE TRIGGER insert_customers_id_trigger
BEFORE INSERT ON Customers
FOR EACH ROW
BEGIN
    IF NEW.customer_id IS NULL THEN
        SET NEW.customer_id = UUID();
    END IF;
END$$

-- Auto generate Invoice Items Id
CREATE TRIGGER insert_invoice_items_id_trigger
BEFORE INSERT ON InvoiceItems
FOR EACH ROW
BEGIN
    IF NEW.invoice_item_id IS NULL THEN
        SET NEW.invoice_item_id = UUID();
    END IF;
END$$

-- Auto generate Invoices Id
CREATE TRIGGER insert_invoices_id_trigger
BEFORE INSERT ON Invoices
FOR EACH ROW
BEGIN
    IF NEW.invoice_id IS NULL THEN
        SET NEW.invoice_id = UUID();
    END IF;
END$$

-- Auto generate Dishes Id
CREATE TRIGGER insert_dishes_id_trigger
BEFORE INSERT ON Dishes
FOR EACH ROW
BEGIN
    IF NEW.dish_id IS NULL THEN
        SET NEW.dish_id = UUID();
    END IF;
END$$

-- Auto generate Order Items Id
CREATE TRIGGER insert_order_items_id_trigger
BEFORE INSERT ON OrderItems
FOR EACH ROW
BEGIN
    IF NEW.order_item_id IS NULL THEN
        SET NEW.order_item_id = UUID();
    END IF;
END$$

-- Auto generate Orders Id
CREATE TRIGGER insert_orders_id_trigger
BEFORE INSERT ON Orders
FOR EACH ROW
BEGIN
    IF NEW.order_id IS NULL THEN
        SET NEW.order_id = UUID();
    END IF;
END$$

-- Auto generate OTP Id
CREATE TRIGGER insert_otp_id_trigger
BEFORE INSERT ON OTP
FOR EACH ROW
BEGIN
    IF NEW.otp_id IS NULL THEN
        SET NEW.otp_id = UUID();
    END IF;
END$$

-- Auto generate Reviews Id
CREATE TRIGGER insert_reviews_id_trigger
BEFORE INSERT ON Reviews
FOR EACH ROW
BEGIN
    IF NEW.review_id IS NULL THEN
        SET NEW.review_id = UUID();
    END IF;
END$$

-- Auto generate Users Id
CREATE TRIGGER insert_users_id_trigger
BEFORE INSERT ON Users
FOR EACH ROW
BEGIN
    IF NEW.user_id IS NULL THEN
        SET NEW.user_id = UUID();
    END IF;
END$$

-- Auto generate Vouchers Id
CREATE TRIGGER insert_vouchers_id_trigger
BEFORE INSERT ON Vouchers
FOR EACH ROW
BEGIN
	IF NEW.voucher_id IS NULL THEN
        SET NEW.voucher_id = UUID();
    END IF;
END$$

DELIMITER ;
-- ---------------- DATAS -------------------------------
INSERT INTO Categories (name, description)
VALUES
	('Burgers', 'A variety of burgers including beef, chicken, abd veggie options'),
    ('Pizza', 'Different types of pizza, including classic and specialty options'),   
    ('Mì', 'Different types of noodles like spaghetti, and stir-fried noodles'),
    ('Cơm', 'Various rice dishes such as fried rice, steamed rice, and rice bowls'),
    ('Nước uống', 'Soft drinks, milkshakes, and a variety of beverages'),
    ('Combos', 'Combo meals including a main dish, side, and drink'),
    ('Ưu đãi đặc biệt', 'Limited-time offers and meal deals for customers');

-- Create category item id variables
SELECT category_id INTO @BurgersCategoryId FROM Categories WHERE name = 'Burgers';
SELECT category_id INTO @PizzaCategoryId FROM Categories WHERE name = 'Pizza';
SELECT category_id INTO @MiCategoryId FROM Categories WHERE name = 'Mì';
SELECT category_id INTO @ComCategoryId FROM Categories WHERE name = 'Cơm';
SELECT category_id INTO @DrinksCategoryId FROM Categories WHERE name = 'Nước uống';
SELECT category_id INTO @CombosCategoryId FROM Categories WHERE name = 'Combos';
SELECT category_id INTO @OffersCategoryId FROM Categories WHERE name = 'Ưu đãi đặc biệt';
INSERT INTO Dishes (category_id, thumbnail_path, name, description, price)
VALUES
-- Burgers
(@BurgersCategoryId, '/images/dishes/burgers/burger-american-jr.jpg', 'American Trio Charcoal Burger ( Size M )', 'Burger với 3 loại xốt mới và vỏ bánh than tre thủ công', 79000),
(@BurgersCategoryId, '/images/dishes/burgers/burger-american-jr.jpg', 'American Trio Charcoal Burger ( Size L )', 'Burger với 3 loại xốt mới và vỏ bánh than tre thủ công', 129000),
(@BurgersCategoryId, '/images/dishes/burgers/cheese-ring-burger_1.jpg', 'CHEESE RING BURGER', 'Burger bò nướng Whopper ( cỡ vừa )', 55000),
(@BurgersCategoryId, '/images/dishes/burgers/6-burger-ca.jpg', 'FISH BURGER', 'Burger Cá giòn', 49000),
(@BurgersCategoryId, '/images/dishes/burgers/12-burger-b_-n_ng-h_nh-chi_n_4.jpg', 'GRILLED ONION BURGER', 'Grilled Onion Burger', 49000),
(@BurgersCategoryId, '/images/dishes/burgers/cheese-ring-burger_1.jpg', 'EXTREME CHEESE BURGER JR', 'Burger bò tắm phô mai ( cỡ vừa )', 65000),
(@BurgersCategoryId, '/images/dishes/burgers/cheese-ring-burger_1.jpg', 'EXTREME CHEESE BURGER JR', 'Burger bò tắm phô mai ( cỡ lớn )', 125000),
(@BurgersCategoryId, '/images/dishes/burgers/11-burger-b_-th_t-heo-x_ng-kh_i_1.jpg', 'BBQ CHIC''N CRISP CHEESE BURGER', 'Burger gà giòn phô mai sốt BBQ', 49000),
(@BurgersCategoryId, '/images/dishes/burgers/burger_ga_pho_mai_so_t_bbq.jpg', 'BBQ CHIC''N CRISP CHEESE BURGER', 'Burger gà giòn phô mai sốt BBQ', 49000),
(@BurgersCategoryId, '/images/dishes/burgers/2-mieng-b_-burger-b_-n_ng-whopper_3.jpg', 'DOUBLE WHOPPER', 'DOUBLE WHOPPER', 175000),
(@BurgersCategoryId, '/images/dishes/burgers/2-mieng-b_-burger-b_-n_ng-whopper_3.jpg', 'WHOPPER', 'Burger bò nướng Whopper ( cỡ lớn )', 125000),
(@BurgersCategoryId, '/images/dishes/burgers/16-burger-b_-n_ng-whopper_1.jpg', 'WHOPPER', 'Burger bò nướng Whopper ( cỡ vừa )', 125000),
(@BurgersCategoryId, '/images/dishes/burgers/2-mieng-bo-burger-b_-ph_-mai_1.jpg', 'DOUBLE CHEESEBURGER', 'Burger 2 miếng bò nướng phô mai', 79000),
(@BurgersCategoryId, '/images/dishes/burgers/dbl-bbq-bc-chz.jpg', 'DOUBLE BBQ BACON CHEESE', 'Burger 2 miếng bò nướng phô mai thịt xông khói', 105000),
-- Pizza
(@PizzaCategoryId, '/images/dishes/pizza/viber_image_2024-12-20_11-11-37-302.jpg', 'Pizza Siêu Topping Siêu Topping Hải Sản 4 Mùa', '12 inches', 355000),
(@PizzaCategoryId, '/images/dishes/pizza/PC-MB1000X667px+super+topping@2x.jpg', 'Pizza Siêu Topping Hải Sản Xốt Pesto "Chanh Sả"', '9 inches', 235000),
(@PizzaCategoryId, '/images/dishes/pizza/viber_image_2024-12-20_10-48-58-179.jpg', 'Pizza Siêu Topping Bơ Gơ Bò Mỹ Xốt Phô Mai Ngập Vị', '9 inches', 235000),
(@PizzaCategoryId, '/images/dishes/pizza/Pizza+Extra+Topping+(2).jpg', 'Pizza Siêu Topping Hải Sản Xốt Mayonnaise', '9 inches', 235000),
(@PizzaCategoryId, '/images/dishes/pizza/Pizza+Extra+Topping+(3).jpg', 'Pizza Siêu Topping Hải Sản Nhiệt Đới Xốt Tiêu', '9 inches', 235000),
(@PizzaCategoryId, '/images/dishes/pizza/Pizza+Extra+Topping+(4).jpg', 'Pizza Siêu Topping Bò Và Tôm Nướng Kiểu Mỹ', '9 inches', 235000),
(@PizzaCategoryId, '/images/dishes/pizza/Pizza+Extra+Topping+(1).jpg', 'Pizza Siêu Topping Dăm Bông Dứa Kiểu Hawaiian', '9 inches', 235000),
(@PizzaCategoryId, '/images/dishes/pizza/Pizza+Extra+Topping+(5).jpg', 'Pizza Siêu Topping Xúc Xích Ý Truyền Thống', '9 inches', 235000),
(@PizzaCategoryId, '/images/dishes/pizza/viber_image_2024-12-20_11-11-35-787.jpg', 'Pizza Hải Sản 4 Mùa', '9 inches', 325000),
(@PizzaCategoryId, '/images/dishes/pizza/PC-MB1000X667px+(NEW)+(1).jpg', 'Pizza Hải Sản Xốt Kim Quất', '9 inches', 215000),
(@PizzaCategoryId, '/images/dishes/pizza/PC-MB1000X667px+(NEW)+(1).png', 'Pizza Hải Sản Xốt Vải', '9 inches', 215000),
(@PizzaCategoryId, '/images/dishes/pizza/lime.png', 'Pizza Hải Sản Xốt Pesto "Chanh Sả"', '9 inches', 215000),
(@PizzaCategoryId, '/images/dishes/pizza/Pizza-Hai-San-Xot-Mayonnaise-Ocean-Mania.jpg', 'Pizza Hải Sản Xốt Mayonnaise', '9 inches', 205000),
(@PizzaCategoryId, '/images/dishes/pizza/Surf-turf-Pizza-Bo-Tom-Nuong-Kieu-My-1.jpg', 'Pizza Bò & Tôm Nướng Kiểu Mỹ', '9 inches', 205000),
(@PizzaCategoryId, '/images/dishes/pizza/Pizza-Hai-San-Xot-Ca-Chua-Seafood-Delight.jpg', 'Pizza Hải Sản Xốt Cà Chua', '9 inches', 205000),
(@PizzaCategoryId, '/images/dishes/pizza/Pizzaminsea-Hai-San-Nhiet-Doi-Xot-Tieu.jpg', 'Pizza Hải Sản Nhiệt Đới Xốt Tiêu', '9 inches', 205000),
(@PizzaCategoryId, '/images/dishes/pizza/viber_image_2024-12-20_09-38-34-546.jpg', 'Pizza Bơ Gơ Bò Mỹ Xốt Habanero', '9 inches', 205000),
(@PizzaCategoryId, '/images/dishes/pizza/viber_image_2024-12-20_09-38-36-347.jpg', 'Pizza Bơ Gơ Bò Mỹ Xốt Phô Mai Ngập Vị', '9 inches', 205000),
(@PizzaCategoryId, '/images/dishes/pizza/Menu+BG+1.jpg', 'Pizza New York Bò Beefsteak Phô Mai', '9 inches', 215000),
(@PizzaCategoryId, '/images/dishes/pizza/Pizza-Thap-Cam-Thuong-Hang-Extravaganza.jpg', 'Pizza Thập Cẩm Thượng Hạng', '9 inches', 215000),
(@PizzaCategoryId, '/images/dishes/pizza/CHEESY+MADNESS+NO+NEW+PC.jpg', 'Pizza Ngập Vị Phô Mai Hảo Hạng', '9 inches', 175000),
(@PizzaCategoryId, '/images/dishes/pizza/Veggie-mania-Pizza-Rau-Cu-Thap-Cam.jpg', 'Pizza Rau Củ Thập Cẩm', '9 inches', 155000),
(@PizzaCategoryId, '/images/dishes/pizza/Meat-lover-Pizza-5-Loai-Thit-Thuong-Hang.jpg', 'Pizza 5 Loại Thịt Thượng Hạng', '9 inches', 205000),
(@PizzaCategoryId, '/images/dishes/pizza/Pepperoni-feast-Pizza-Xuc-Xich-Y.jpg', 'Pizza Xúc Xích Ý Truyền Thống', '9 inches', 205000),
(@PizzaCategoryId, '/images/dishes/pizza/Pizza-Dam-Bong-Dua-Kieu-Hawaii-Hawaiian.jpg', 'Pizza Dăm Bông Dứa Kiểu Hawaii', '9 inches', 175000),
(@PizzaCategoryId, '/images/dishes/pizza/Pizza-Pho-Mai-Hao-Hang-Cheese-Mania.jpg', 'Pizza Phô Mai Truyền Thống', '9 inches', 155000),
-- Noodles
(@MiCategoryId, '/images/dishes/noodles/mi-carbonara-300x300.jpg', 'Mì Carbonara', 'Mì spaghetti, thịt xông khói, phô mai Parmesan, lòng đỏ trứng, và tiêu đen.', 155000),
(@MiCategoryId, '/images/dishes/noodles/mi-bolognese-300x300.jpg', 'Mì Bolognese', 'Sự kết hợp hoàn hảo giữa mì spaghetti và sổt Bolognese', 155000),
(@MiCategoryId, '/images/dishes/noodles/mi-y-pho-mai-300x300.jpg', 'Mì Ý phô mai', 'Kết hợp giữa mì spaghetti và sốt phô mai béo ngậy', 165000),
-- Rices
(@ComCategoryId, '/images/dishes/rices/35.RM1CmBBQTender.png', 'Cơm BBQ gà không xương', '', 39000),
(@ComCategoryId, '/images/dishes/rices/36.RM2CmBBQPopcorn.png', 'Cơm BBQ gà viên', '', 39000),
(@ComCategoryId, '/images/dishes/rices/37.RM3CmBBQGGin.png', 'Cơm BBQ gà giòn cay', '', 45000),
(@ComCategoryId, '/images/dishes/rices/37.RM3CmBBQGGin.png', 'Cơm BBQ gà giòn không cay', '', 45000),
(@ComCategoryId, '/images/dishes/rices/38.RM4CmGTNM.png', 'Cơm gà tắm nước mắm', '', 49000),
-- Drinks
(@ComCategoryId, '/images/dishes/drinks/Milohop.webp', 'Milo', '', 25000),
(@ComCategoryId, '/images/dishes/drinks/Dasani.webp', 'Nước suối dasani', '', 15000),
(@ComCategoryId, '/images/dishes/drinks/Coca.webp', 'Coca Cola', '', 15000),
(@ComCategoryId, '/images/dishes/drinks/Sprite.webp', 'Sprite', '', 15000),
(@ComCategoryId, '/images/dishes/drinks/Fanta.webp', 'Fanta', '', 15000),
(@ComCategoryId, '/images/dishes/drinks/Cocazero.webp', 'Coca Cola Zero', '', 15000),
-- Combos
(@CombosCategoryId, '/images/dishes/combos/combo-doublewhopper_2.jpg', 'COMBO DOUBLE WHOPPER JR.', '1 Burger 2 miếng bò nướng ( cỡ vừa ) + Khoai chiên (M) + 1 Đồ uống', 95000),
(@CombosCategoryId, '/images/dishes/combos/combo-whopper-lover-new.jpg', 'COMBO WHOPPER LOVER', '1 Burger bò nướng Whopper ( cỡ lớn ) + Khoai chiên (S) + 4 gà cuộn rong biển + 1 Đồ uống', 159000),
(@CombosCategoryId, '/images/dishes/combos/combo-ex-cheese-whopper-lover-new.jpg', 'COMBO EXTREME CHEESE LOVER', '1 Burger bò tắm phô mai ( cỡ lớn ) + Khoai chiên (S) + 4 gà cuộn rong biển + 1 Đồ uống', 159000),
(@CombosCategoryId, '/images/dishes/combos/cb-whp-bbq-bc-chz.jpg', 'COMBO WHOPPER BBQ BACON & CHEESE', '1 Burger bò nướng phô mai thịt xông khói + Khoai chiên (M) + 1 Đồ uống', 175000),
(@CombosCategoryId, '/images/dishes/combos/cb-dbl-whp-bbq-bc-chz.jpg', 'COMBO DOUBLE WHOPPER BBQ BACON AND CHEESE', '1 Burger 2 miếng bò nướng phô mai thịt xông khói ( cỡ lớn ) + Khoai chiên (M) + 1 Đồ uống', 245000),
(@CombosCategoryId, '/images/dishes/combos/cb-dbl-bbq-bc-chz.jpg', 'COMBO DOUBLE BBQ BACON CHEESE', '1 Burger 2 miếng bò nướng phô mai thịt xông khói ( cỡ vừa ) + Khoai chiên (M) + 1 Đồ uống', 135000),
(@CombosCategoryId, '/images/dishes/combos/m_n_ngon_ph_i_th_-_1.png', 'Combo Một Mình Ăn Ngon', '1 Mì Ý gà rán + 1 Nước ngọt', 78000),
(@CombosCategoryId, '/images/dishes/combos/m_n_ngon_ph_i_th_-_2_2__1.png', 'Combo Cặp đôi ăn ý', '2 Mì Ý gà rán + 2 Nước ngọt + 1 Khoai tây chiên', 145000),
(@CombosCategoryId, '/images/dishes/combos/m_n_ngon_ph_i_th_-_3.png', 'Combo Cả Nhà No Nê', '3 Mì Ý gà rán + 3 Nước ngọt + 2 Miếng gà rán + 1 Khoai tây chiên', 185000),
(@CombosCategoryId, '/images/dishes/combos/m_n_ngon_ph_i_th_-_4_2.png.png', 'Combo Bạn Bè Tụ Tập', '2 Mì Ý gà rán + 2 Cơm gà rán + 4 Nước ngọt + 2 Bánh xoài + 2 Khoai tây chiên', 322000),
(@CombosCategoryId, '/images/dishes/combos/m_n_ngon_ph_i_th_-_7.png', 'Tiệc Kiểu Mới, Quà Chuẩn Gu', '4 Mì Ý gà rán + 4 Gà rán + 5 Nước ngọt + 4 Khoai tây chiên', 699000);

INSERT INTO Vouchers (code, description, discount_type, discount_value, valid_from, valid_to, min_purchase, number_of_uses)
VALUES
('EATSYWELCOME', 'Giảm 10% cho hóa đơn', 'Percentage', 0.1, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 0, 999),
('EATSY50', 'Giảm 50.000đ cho đơn hàng từ 500.000đ', 'Amount', 50000, '2025-01-01 00:00:00', '2025-06-30 23:59:59', 500000, 100),
('WELCOME20', 'Chào mừng khách hàng mới, giảm 20%', 'Percentage', 0.2, '2025-01-01 00:00:00', '2025-03-31 23:59:59', 0, 100),
('BIGSALE100', 'Giảm 100.000đ cho đơn hàng từ 1.000.000đ', 'Amount', 100000, '2025-01-01 00:00:00', '2025-08-31 23:59:59', 1000000, 100),
('FREESHIP', 'Miễn phí vận chuyển cho đơn hàng từ 300.000đ', 'Amount', 30000, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 300000, 100);
