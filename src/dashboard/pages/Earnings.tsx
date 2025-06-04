import React from "react";
import { useNavigate } from "react-router-dom";
import productUniform from "../../assets/ustp thingS/yummy 2.png";
import LeftArrow from "../../assets/ustp thingS/LeftArrow.png";
import ustpLogo from '../../assets/ustp-things-logo.png';

const earningsOverview = {
  total: "₱1,000,000",
  thisMonth: "₱1,000,000",
  thisWeek: "₱1,000,000",
};

const platformCommission = {
  toRelease: {
    total: "₱1,000",
    thisMonth: "₱1,000",
  },
  released: {
    total: "₱1,000",
    thisMonth: "₱1,000",
  },
};

const earningDetails = [
  {
    id: 1,
    product: "Uniform Set USTP (Female) – Blouse, Skirt, and Necktie",
    qty: 1,
    status: "Pending",
    amount: "₱1,000,000",
    image: productUniform,
  },
  {
    id: 2,
    product: "Uniform Set USTP (Female) – Blouse, Skirt, and Necktie",
    qty: 1,
    status: "Completed",
    amount: "₱1,000,000",
    image: productUniform,
  },
  {
    id: 3,
    product: "Uniform Set USTP (Female) – Blouse, Skirt, and Necktie",
    qty: 1,
    status: "Completed",
    amount: "₱1,000,000",
    image: productUniform,
  },
];

const Earnings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar (copied from Seller Page) */}
      <header className="flex items-center gap-4 px-8 pr-[47px] py-4 bg-[#FFF3F2] h-[70px] shadow-[0_4px_4px_0_rgba(0,0,0,0.1)] sticky top-0 z-30">
        <button onClick={() => navigate(-1)}>
          <img src={LeftArrow} alt="Back" className="h-10" />
        </button>
        <img src={ustpLogo} alt="USTP Things Logo" className="w-[117px] h-[63px] object-contain" />
        <span className="text-3xl font-bold text-[#F88379] pb-1">My Earnings</span>
      </header>
      <div className="p-8">
        {/* Earnings Overview and Platform Commission */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="flex-1 bg-[#FFF3F2] rounded-2xl p-8">
            <div className="font-bold text-lg text-[#F88379] mb-4">Earnings Overview</div>
            <div className="text-gray-700 mb-2">Total Earnings</div>
            <div className="font-bold text-2xl mb-4">{earningsOverview.total}</div>
            <div className="text-gray-700 mb-1">This Month</div>
            <div className="font-bold text-lg mb-2">{earningsOverview.thisMonth}</div>
            <div className="text-gray-700 mb-1">This Week</div>
            <div className="font-bold text-lg">{earningsOverview.thisWeek}</div>
          </div>
          <div className="flex-1 bg-[#FFF3F2] rounded-2xl p-8">
            <div className="font-bold text-lg text-[#F88379] mb-4">Platform Commission</div>
            <div className="text-gray-700 mb-1">To Release:</div>
            <div className="flex justify-between mb-2">
              <span>Total Release</span>
              <span className="font-bold">{platformCommission.toRelease.total}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span>This Month</span>
              <span className="font-bold">{platformCommission.toRelease.thisMonth}</span>
            </div>
            <div className="text-gray-700 mb-1">Released:</div>
            <div className="flex justify-between mb-2">
              <span>Total Released</span>
              <span className="font-bold">{platformCommission.released.total}</span>
            </div>
            <div className="flex justify-between">
              <span>This Month</span>
              <span className="font-bold">{platformCommission.released.thisMonth}</span>
            </div>
          </div>
        </div>
        {/* Earning Details */}
        <div>
          <div className="font-bold text-lg text-[#F88379] mb-4">Earning Details</div>
          <div className="bg-[#FFF3F2] rounded-2xl p-8">
            <div className="flex font-semibold text-gray-500 text-lg mb-6">
              <div className="flex-1">Order</div>
              <div className="w-1/4 text-center">Status</div>
              <div className="w-1/4 text-right">Payout Amount</div>
            </div>
            {earningDetails.map((tx) => (
              <div key={tx.id} className="flex items-center mb-6 last:mb-0">
                <div className="flex-1 flex items-center">
                  <img src={tx.image} alt={tx.product} className="w-12 h-12 rounded object-cover mr-4" />
                  <div>
                    <div className="font-semibold text-gray-800">{tx.product}</div>
                    <div className="text-xs text-gray-500">{tx.qty}x</div>
                  </div>
                </div>
                <div className="w-1/4 text-center font-semibold text-[#F88379]">
                  {tx.status}
                </div>
                <div className="w-1/4 text-right font-bold text-gray-700">
                  {tx.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earnings;
