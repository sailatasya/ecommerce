import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
// import Order from "@/models/Order";
import Order from "@/lib/models/Order";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { cartItems, customer } = await req.json();

    console.log("[checkout_POST] cartItems: ", cartItems);

    if (!cartItems || !customer) {
      return new NextResponse("Not enough data to checkout", { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ["ID"],
      },
      shipping_options: [
        { shipping_rate: "shr_1PUCVpFL12zzJujOL9UV9iSA" },
        // not used: { shipping_rate: "shr_1PUCX1FL12zzJujOJ8st9TDQ" },
        // not used: { shipping_rate: "shr_1PUCUwFL12zzJujOLHEhAlbn" },
      ],
      line_items: cartItems.map((cartItem: any) => ({
        price_data: {
          currency: "idr",
          product_data: {
            name: cartItem.item.title,
            metadata: {
              productId: cartItem.item._id,
              ...(cartItem.size && { size: cartItem.size }),
              ...(cartItem.color && { color: cartItem.color }),
            },
          },
          unit_amount: cartItem.item.price * 100,
        },
        quantity: cartItem.quantity,
      })),
      client_reference_id: customer.clerkId,
      success_url: `${process.env.ECOMMERCE_STORE_URL}/payment_success`,
      cancel_url: `${process.env.ECOMMERCE_STORE_URL}/cart`,
    });

    // check session is created
    if (!session) {
      return new NextResponse("Failed to create session", { status: 500 });
    }

    // Store it to order collection
    const newOrder = await insertOrderToDatabase(session.id, cartItems, customer, session.shipping_cost, session.customer_details, session.amount_total); 

    return NextResponse.json(session, { headers: corsHeaders });
  } catch (err) {
    console.log("[checkout_POST]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function insertOrderToDatabase(sessionId: string, cartItems: any, customer: any, shippingRate: any, shippingDetails: any, totalAmount: number | null) {

  console.log("[insertOrderToDatabase] sessionId: ", sessionId);

  if (!sessionId) {
    console.error("[insertOrderToDatabase] error: Not enough data to insert order, sessionId is null");
    return null;
  }

  // validate if params is valid
  if (!cartItems || !customer) {
    console.error("[insertOrderToDatabase] error: Not enough data to insert order, cartItems or customer is null");
    return null;
  }

  if (!cartItems.length || !customer.clerkId) {
    console.error("[insertOrderToDatabase] error: Not enough data to insert order, cartItems or customer is empty");
    return null;
  }

  if (!shippingRate) {
    console.error("[insertOrderToDatabase] error: Not enough data to insert order, shippingRate is null");
    return null;
  }

  if (totalAmount === null) {
    console.error("[insertOrderToDatabase] Not enough data to insert order");
    return null;
  }

  return await Order.create({
    sessionId: sessionId,
    customerClerkId: customer.clerkId,
    products: cartItems.map((cartItem: any) => ({
      product: cartItem.item._id,
      productId: cartItem.item._id,
      color: cartItem.color,
      size: cartItem.size,
      quantity: cartItem.quantity,
    })),
    shippingAddress: {
      street: "null",
      city: "null",
      state: "null",
      postalCode: "null",
      country: "null",
    },
    shippingRate: shippingRate ? shippingRate.shipping_rate : null,
    totalAmount: totalAmount/100 ?? 0,
    createdAt: new Date(),
  });
}
