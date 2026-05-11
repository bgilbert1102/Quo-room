import { useState } from 'react'
import { AgentFloor } from './rooms/AgentFloor'
import { BusinessRoom } from './rooms/BusinessRoom'

type View = 'floor' | 'business'

export default function App() {
  const [view, setView] = useState<View>('floor')
  return view === 'business'
    ? <BusinessRoom onBack={() => setView('floor')} />
    : <AgentFloor onOpenBusiness={() => setView('business')} />
}
