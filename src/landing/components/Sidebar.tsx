interface SidebarProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export default function Sidebar({ onLoginClick, onSignupClick }: SidebarProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-[30px] bg-pink-50 w-[348px] h-[793px] border-r-[5px] border-r-white">
      <div className="flex flex-col items-center gap-[20px] -mt-[10px]">
        <button
          className="w-[177px] h-[56px] rounded-[23.08px] border-[0.77px] border-[#F88379] bg-transparent text-[#F88379] font-bold text-xl hover:bg-pink-100 transition"
          onClick={onLoginClick}
        >
          Login
        </button>
        <button
          className="w-[177px] h-[56px] rounded-[23.08px] border-[0.77px] border-[#F88379] bg-transparent text-[#F88379] font-bold text-xl hover:bg-pink-100 transition"
          onClick={onSignupClick}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
} 