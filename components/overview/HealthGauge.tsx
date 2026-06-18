'use client'

interface HealthGaugeProps {
  score: number
}

export function HealthGauge({ score }: HealthGaugeProps) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#f97316' : '#ef4444'

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="12"
          />
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
          <text x="70" y="65" textAnchor="middle" fill="white" fontSize="28" fontWeight="700">
            {score}%
          </text>
          <text x="70" y="82" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">
            HEALTH SCORE
          </text>
        </svg>
      </div>
    </div>
  )
}
