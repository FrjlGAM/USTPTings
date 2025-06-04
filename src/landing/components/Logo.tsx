import logo from '../../assets/ustp-things-logo.png';

export default function Logo() {
  return (
    <div className="flex items-center">
      <img src={logo} alt="USTP Things Logo" className="w-[117px] h-[63px] object-contain" />
    </div>
  );
} 