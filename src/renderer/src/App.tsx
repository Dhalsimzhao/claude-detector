import { PetSprite } from './components/PetSprite'
import { SessionBadge } from './components/SessionBadge'
import { useAnimationState } from './hooks/useAnimationState'

function App() {
  const { state, sessions } = useAnimationState()

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      WebkitAppRegion: 'drag',
      cursor: 'grab',
      userSelect: 'none'
    } as React.CSSProperties}>
      <PetSprite state={state} />
      <SessionBadge sessions={sessions} />
    </div>
  )
}

export default App
