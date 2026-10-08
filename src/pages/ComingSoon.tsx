import logo from "../assets/sealman_iot_logo.png";

export default function ComingSoon() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 bg-white">
      <img
        className="w-80 max-w-full animate-logo-pulse motion-reduce:animate-none"
        src={logo}
        alt="Sealman IoT"
      />
      <div className="h-1 w-60 overflow-hidden rounded-full bg-light-gray" role="presentation">
        <span className="block h-full w-2/5 rounded-full bg-linear-to-r from-active-blue to-vibrant-blue animate-bar-slide motion-reduce:animate-none" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-night-blue">Coming Soon</h1>
        <p className="mt-1 text-sm text-dark-gray">Deployments are on their way.</p>
      </div>
    </div>
  );
}
