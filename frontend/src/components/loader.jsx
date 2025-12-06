import React from 'react';

export default function Loader({ size = 200 }) {
	const loaderSize = Math.round(size * 0.5);

	return (
		<div style={{
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			height: '100%',
			width: '100%',
			background: 'linear-gradient(135deg, #243375ff 0%, #51267cff 100%)',
			position: 'fixed',
			inset: 0,
			zIndex: 9999
		}}>
			<div style={{
				position: 'relative',
				width: size,
				height: size,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center'
			}}>
				<style>{`
          @keyframes rotate1 {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes rotate2 {
            from { transform: rotate(45deg); }
            to { transform: rotate(405deg); }
          }
          @keyframes rotate3 {
            from { transform: rotate(90deg); }
            to { transform: rotate(450deg); }
          }
          
          .loader-circle {
            position: absolute;
            width: ${loaderSize}px;
            height: ${loaderSize}px;
          }
          
          .arc {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border-bottom: ${Math.round(loaderSize * 0.1)}px solid;
            animation: rotate1 1.5s linear infinite;
            box-shadow: 0 0 15px rgba(139, 92, 246, 0.8);
          }
          
          .arc:nth-child(1) {
            border-bottom-color: #e0d4ff;
            animation: rotate1 1.5s linear infinite;
            animation-delay: -0.8s;
          }
          
          .arc:nth-child(2) {
            border-bottom-color: #c4b5fd;
            animation: rotate2 1.5s linear infinite;
            animation-delay: -0.4s;
          }
          
          .arc:nth-child(3) {
            border-bottom-color: #a78bfa;
            animation: rotate3 1.5s linear infinite;
            animation-delay: 0s;
          }
          
          .brand-text {
            position: absolute;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-weight: 800;
            color: white;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
          }
        `}</style>

				<div className="loader-circle">
					<div className="arc"></div>
					<div className="arc"></div>
					<div className="arc"></div>
				</div>

				<div className="brand-text" style={{
					fontSize: `${loaderSize * 0.25}px`,
					textAlign: 'center'
				}}>
					SYNAPSE
				</div>
			</div>
		</div>
	);
}