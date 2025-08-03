import { defineAPI } from "rlib/server";

export default defineAPI({
  name: "checkcouponcode",
  url: "/api/main/check-coupon-code",
  async handler(arg: { code: string }) {
    // TODO: Implement actual coupon checking logic
    // For now, return a stub response
    return {
      status: "failed" as const,
      message: "Kode promo tidak valid",
      coupon: {
        code: arg.code,
        type: "percent",
        value: 0,
        max_discount: null
      }
    };
  },
});