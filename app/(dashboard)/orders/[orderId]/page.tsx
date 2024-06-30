import { DataTable } from "@/components/custom ui/DataTable"
import { columns } from "@/components/orderItems/OrderItemsColums"
import { stripe } from "@/lib/stripe"

var customerAddress = {
  street: "1234 Main St",
  city: "San Francisco",
  state: "CA",
  postalCode: "94111",
  country: "US"
}

var customerInfo = { 
  name: "John Doe",
  email: "johndoe@gmailtest.com",
  address: customerAddress
}

const OrderDetails = async ({ params }: { params: { orderId: string }}) => {
  const res = await fetch(`${process.env.ADMIN_DASHBOARD_URL}/api/orders/${params.orderId}`);
  const { orderDetails } = await res.json();

  const session = await stripe.checkout.sessions.retrieve(orderDetails.sessionId);

  var customer = customerInfo;

  if (session?.customer_details) {
    customer = {
      name: session.customer_details.name ?? "",
      email: session.customer_details.email ?? "",
      address: {
        street: session.customer_details.address?.line1 ?? "",
        city: session.customer_details.address?.city ?? "",
        state: session.customer_details.address?.state ?? "",
        postalCode: session.customer_details.address?.postal_code ?? "",
        country: session.customer_details.address?.country ?? ""
      }
    }
  }
  return (
    <div className="flex flex-col p-10 gap-5">
      <p className="text-base-bold">
        Order ID: <span className="text-base-medium">{orderDetails._id}</span>
      </p>
      <p className="text-base-bold">
        Customer name: <span className="text-base-medium">{customer.name}</span>
      </p>
      <p className="text-base-bold">
        Shipping address: <span className="text-base-medium">{customer.address.street}, {customer.address.city}, {customer.address.state}, {customer.address.postalCode}, {customer.address.country}</span>
      </p>
      <p className="text-base-bold">
        Total Paid: <span className="text-base-medium">${orderDetails.totalAmount}</span>
      </p>
      <p className="text-base-bold">
        Shipping rate ID: <span className="text-base-medium">{orderDetails.shippingRate}</span>
      </p>
      <DataTable columns={columns} data={orderDetails.products} searchKey="product"/>
    </div>
  )
}

export default OrderDetails
