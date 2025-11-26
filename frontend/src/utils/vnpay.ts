import CryptoJS from "crypto-js";
import qs from "qs";

export const createVnpayUrl = (amount) => {
    const vnp_TmnCode = "YOUR_TMN_CODE";
    const vnp_HashSecret = "YOUR_SECRET";
    const vnp_ReturnUrl = "myapp://vnpay_return";
    const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    const orderId = Date.now().toString();
    const createDate = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

    let params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode,
        vnp_Amount: amount * 100,
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toan don hang #${orderId}`,
        vnp_Locale: "vn",
        vnp_ReturnUrl,
        vnp_CreateDate: createDate,
        vnp_IpAddr: "127.0.0.1"
    };

    const sorted = Object.keys(params).sort().reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
    }, {});

    const signData = qs.stringify(sorted, { encode: false });

    const signed = CryptoJS.HmacSHA512(signData, vnp_HashSecret).toString();

    sorted["vnp_SecureHash"] = signed;

    return `${vnp_Url}?${qs.stringify(sorted, { encode: false })}`;
};
