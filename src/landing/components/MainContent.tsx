import hero from '../../assets/hero.png';

export default function MainContent() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <img src={hero} alt="Hero" className="max-w-full max-h-full object-contain" />
    </div>
  );
} 