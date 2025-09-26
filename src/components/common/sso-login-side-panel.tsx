import React from "react";

const LoginSidePanel: React.FC = () => {
  return (
    <div className="hidden lg:flex flex-1 bg-signin items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-6">
        <video
          src="/assets/img/poligap.mp4"
          muted
          autoPlay
          loop
          playsInline
          width={600}
          height={800}
          className="rounded-xl w-full h-auto"
        />
      </div>
    </div>
  );
};

export default LoginSidePanel;
