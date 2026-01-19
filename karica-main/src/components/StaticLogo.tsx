import logo2a from '@/assets/karica-logo-2a.png'; // cresta alta, occhi aperti

interface StaticLogoProps {
  className?: string;
}

const StaticLogo = ({ className = "h-12 w-12" }: StaticLogoProps) => {
  return (
    <img
      src={logo2a}
      alt="Karica"
      className={`object-contain object-top ${className}`}
    />
  );
};

export default StaticLogo;
