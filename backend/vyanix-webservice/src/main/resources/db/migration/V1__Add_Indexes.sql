CREATE INDEX idx_product_slug ON products(slug);
CREATE INDEX idx_category_slug ON categories(slug);
CREATE INDEX idx_sku_product ON skus(product_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
