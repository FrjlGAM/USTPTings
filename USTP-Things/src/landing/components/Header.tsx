import Logo from './Logo';
import cartIcon from '../../assets/ustp thingS/Shopping cart.png';
import searchIcon from '../../assets/ustp thingS/search.png';

export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 pr-[47px] py-4 bg-pink-50 h-[71px] border-b-[5px] border-b-white">
      <Logo />
      <div className="flex items-center gap-[27px]">
        <div className="relative">
          <input
            className="w-[371px] h-[41px] pl-12 pr-4 py-2 rounded-full border-2 border-[rgba(230,230,230,0.80)] focus:outline-none text-[rgba(248,131,121,0.80)] placeholder-[rgba(248,131,121,0.80)]"
            placeholder="Search"
            readOnly
          />
          <img 
            src={searchIcon} 
            alt="Search" 
            className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" 
          />
        </div>
        <img src={cartIcon} alt="Shopping Cart" className="w-[30px] h-[30px]" />
      </div>
    </header>
  );
} 