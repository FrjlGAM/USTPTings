import { formatCurrency, formatPercentage } from '../../utils/serviceFees';

interface OrderDetails {
  productName: string;
  productImage: string;
  price: string;
  quantity: number;
  subtotal: number;
  serviceFeeAmount?: number;
  serviceFeeRate?: number;
  totalAmount: number;
  selectedDate: string;
  selectedTime: string;
  paymentMethod: string;
  campusLocation?: string;
}

interface ConfirmOrderProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  orderDetails?: OrderDetails;
}

export default function ConfirmOrder({ open, onConfirm, onCancel, orderDetails }: ConfirmOrderProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred background overlay */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur transition-all duration-300" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl px-8 py-8 flex flex-col min-w-[600px] max-w-[700px] max-h-[90vh] overflow-y-auto border-4 border-[#ECB3A8] animate-fade-in-scale">
        <h2 className="text-3xl font-bold text-[#F88379] mb-6 text-center">Confirm Your Order</h2>
        
        {orderDetails && (
          <div className="mb-6 space-y-4">
            {/* Product Details */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Product Details</h3>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={orderDetails.productImage} 
                  alt={orderDetails.productName} 
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{orderDetails.productName}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-600">Price: {orderDetails.price}</span>
                    <span className="text-gray-600">Qty: {orderDetails.quantity}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Delivery Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{orderDetails.selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{orderDetails.selectedTime}</span>
                </div>
                {orderDetails.campusLocation && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{orderDetails.campusLocation}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment:</span>
                  <span className="font-medium">{orderDetails.paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Price Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(orderDetails.subtotal)}</span>
                </div>
                {orderDetails.serviceFeeAmount && orderDetails.serviceFeeAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Service Fee ({formatPercentage(orderDetails.serviceFeeRate || 0)}):
                    </span>
                    <span className="font-medium">{formatCurrency(orderDetails.serviceFeeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="font-bold text-lg text-[#F88379]">{formatCurrency(orderDetails.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-4 w-full">
          <button
            onClick={onCancel}
            className="flex-1 border-2 border-[#FF4444] text-[#FF4444] font-bold py-3 rounded-xl hover:bg-[#FF4444] hover:text-white transition text-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#4CAF50] border-2 border-[#4CAF50] text-white font-bold py-3 rounded-xl hover:bg-[#4CAF50]/90 transition text-lg"
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
} 