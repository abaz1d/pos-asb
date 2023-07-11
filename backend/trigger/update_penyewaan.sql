CREATE OR REPLACE FUNCTION update_penyewaan() RETURNS TRIGGER AS $set_penyewaan$
DECLARE
    outlet VARCHAR;
    status_sewa BOOLEAN;
    stok_lama INTEGER;
    sum_harga NUMERIC;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Update stok hanya ketika status penyewaan adalah false
            SELECT status INTO status_sewa FROM penyewaan WHERE no_invoice = NEW.no_invoice;
        IF NOT status_sewa THEN
            SELECT id_outlet INTO outlet FROM penyewaan WHERE no_invoice = NEW.no_invoice;
            SELECT stok_varian INTO stok_lama FROM sub_varian WHERE id_varian = NEW.id_varian AND id_outlet = outlet;
            UPDATE sub_varian SET stok_varian = stok_lama - NEW.qty WHERE id_varian = NEW.id_varian AND id_outlet = outlet;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
    -- Update stok hanya ketika status penyewaan sebelumnya adalah false
        SELECT status INTO status_sewa FROM penyewaan WHERE no_invoice = NEW.no_invoice;
    IF NOT status_sewa THEN
        SELECT id_outlet INTO outlet FROM penyewaan WHERE no_invoice = NEW.no_invoice;
        SELECT stok_varian INTO stok_lama FROM sub_varian WHERE id_varian = NEW.id_varian AND id_outlet = outlet;
        UPDATE sub_varian SET stok_varian = stok_lama + OLD.qty - NEW.qty WHERE id_varian = NEW.id_varian AND id_outlet = outlet;
    ELSE
        SELECT id_outlet INTO outlet FROM penyewaan WHERE no_invoice = NEW.no_invoice;
        SELECT stok_varian INTO stok_lama FROM sub_varian WHERE id_varian = NEW.id_varian AND id_outlet = outlet;
        UPDATE sub_varian SET stok_varian = stok_lama + OLD.qty WHERE id_varian = NEW.id_varian AND id_outlet = outlet;
    END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        -- Update stok hanya ketika status penyewaan adalah false
            SELECT id_outlet INTO outlet FROM penyewaan WHERE no_invoice = OLD.no_invoice;
            SELECT stok_varian INTO stok_lama FROM sub_varian WHERE id_varian = OLD.id_varian AND id_outlet = outlet;
            UPDATE sub_varian SET stok_varian = stok_lama + OLD.qty WHERE id_varian = OLD.id_varian AND id_outlet = outlet;
    END IF;

    -- Update total harga sewa di tabel penyewaan
	RAISE NOTICE 'Value: %', NEW;
    SELECT sum(total_harga_detail_sewa) INTO sum_harga FROM penyewaan_detail WHERE no_invoice = NEW.no_invoice;
    UPDATE penyewaan SET total_harga = sum_harga WHERE no_invoice = NEW.no_invoice;
	
    RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$set_penyewaan$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_penyewaan
AFTER INSERT OR UPDATE OR DELETE ON penyewaan_detail
FOR EACH ROW EXECUTE FUNCTION update_penyewaan();
