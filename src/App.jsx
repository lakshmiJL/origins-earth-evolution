import { MotionConfig, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import asteroidImpactImage from './assets/asteroid-impact-generated.png'
import humanEvolutionImage from './assets/img.png'
import './App.css'

const eraSections = [
  {
    era: 'Precambrian',
    period: '4.6–541 Ma',
    summary: 'Earth was a volcanic world of oceans, storms, and the first microbial life.',
    accent: '#61d2ff',
    text: 'Deep blue seas and glowing microbes shaped the first ecosystems.',
    facts: ['Microbes dominate the oceans', 'Atmosphere begins to stabilize', 'Volcanic land surfaces warm the planet'],
    image:
      'https://images.unsplash.com/photo-1582721478779-0ae163c05a60?auto=format&fit=crop&w=1200&q=80',
  },
  {
    era: 'Paleozoic',
    period: '541–252 Ma',
    summary: 'Shallow seas bloom with invertebrates, fish, and the first forests on land.',
    accent: '#7fe37a',
    text: 'Warm jungles, giant ferns, and amphibians fill the Earth with motion.',
    facts: ['Forest expansion changes the climate', 'Amphibians conquer shorelines', 'Mass extinction reshapes ecosystems'],
    image:
      'https://images.unsplash.com/photo-1525232505362-0769a7c3bb95?auto=format&fit=crop&w=1200&q=80',
  },
  {
    era: 'Mesozoic',
    period: '252–66 Ma',
    summary: 'Dinosaurs rise, diversify, and dominate a lush, thriving world.',
    accent: '#f7cd5d',
    text: 'Gigantic reptiles roam the forests while flowering plants begin to transform the planet.',
    facts: ['Dinosaurs diversify across continents', 'Flying reptiles dominate the skies', 'A giant impact ends the age of reptiles'],
    image:
      'https://images.unsplash.com/photo-1743600160621-144e62297185?auto=format&fit=crop&w=1200&q=80',
  },
  {
    era: 'Cenozoic',
    period: '66 Ma–Today',
    summary: 'Mammals, grasses, and humans reshape the living world in the age of modern biodiversity.',
    accent: '#ff9c73',
    text: 'Grasslands spread, ice ages sweep the globe, and humans begin to create culture.',
    facts: ['Mammal evolution accelerates', 'Ice ages reshape migration', 'Homo sapiens transforms Earth'],
    image:
      'https://images.unsplash.com/photo-1667209925123-877417c612ae?auto=format&fit=crop&w=1200&q=80',
  },
]

const lifecycleSpecies = [
  {
    name: 'Butterfly',
    stage: 'Metamorphosis',
    stages: ['Egg', 'Caterpillar', 'Chrysalis', 'Adult'],
    description:
      'From a tiny egg laid on a host plant to a winged pollinator, the butterfly reveals how ecosystems depend on transformation and timing.',
  },
  {
    name: 'Frog',
    stage: 'Amphibian life cycle',
    stages: ['Egg mass', 'Tadpole', 'Metamorph', 'Adult'],
    description:
      'Frogs start in water, then adapt for land as lungs and limbs develop, showing one of nature’s clearest life transitions.',
  },
  {
    name: 'Fish',
    stage: 'Aquatic growth',
    stages: ['Egg', 'Larva', 'Juvenile', 'Adult'],
    description:
      'Fish grow through fast-moving aquatic stages, relying on currents, oxygen, and the health of rivers and oceans to survive.',
  },
  {
    name: 'Turtle',
    stage: 'Long-lived survival',
    stages: ['Nest', 'Hatchling', 'Young swimmer', 'Adult'],
    description:
      'From vulnerable hatchlings to resilient adults, turtles showcase slow growth, shell protection, and environmental adaptation.',
  },
  {
    name: 'Bee',
    stage: 'Pollination cycle',
    stages: ['Larva', 'Pupa', 'Worker', 'Forager'],
    description:
      'Bees carry pollen from flower to flower, helping plants reproduce while building complex social colonies.',
  },
  {
    name: 'Plant',
    stage: 'Photosynthesis',
    stages: ['Seed', 'Sprout', 'Sapling', 'Bloom'],
    description:
      'Plants turn sunlight into energy, anchor soil, and support almost every food chain on Earth with their growth and reproduction.',
  },
  {
    name: 'Bird',
    stage: 'Migration',
    stages: ['Egg', 'Nestling', 'Fledgling', 'Adult'],
    description:
      'Birds grow from fragile hatchlings to skilled fliers, often traveling huge distances across continents to find food and shelter.',
  },
  {
    name: 'Human',
    stage: 'Development',
    stages: ['Infant', 'Child', 'Teen', 'Adult'],
    description:
      'Human growth is a long learning process shaped by culture, language, and social knowledge, allowing innovation to spread across generations.',
  },
]

const lifecycleArt = {
  Butterfly: ['🥚', '🐛', '🟢', '🦋'],
  Frog: ['🫧', '🐟', '🐸', '🐸'],
  Fish: ['🫧', '🐟', '🐠', '🐟'],
  Turtle: ['🥚', '🐢', '🐢', '🐢'],
  Bee: ['〰️', '🐛', '🟡', '🐝'],
  Plant: ['🌰', '🌱', '🌿', '🌼'],
  Bird: ['🥚', '🐣', '🐤', '🐦'],
  Human: ['👶', '🧒', '🧑', '🧑‍🦳'],
}

function LifecycleIllustration({ species, stageIndex, compact = false }) {
  return (
    <span
      className={compact ? 'lifecycle-illustration is-compact' : 'lifecycle-illustration'}
      data-species={species.toLowerCase()}
      aria-hidden="true"
    >
      {lifecycleArt[species][stageIndex]}
    </span>
  )
}

const humanEvolution = [
  {
    period: '4 MYA',
    title: 'Australopithecus',
    detail: 'Walks upright on two feet for the first time. Brain ~450cc — about a third of ours.',
  },
  {
    period: '2.4 MYA',
    title: 'Homo habilis',
    detail: '“Handy man”. Carves the first stone tools, opening a new diet of meat and marrow.',
  },
  {
    period: '1.9 MYA',
    title: 'Homo erectus',
    detail: 'Tames fire. Migrates out of Africa. Cooked food fuels a rapidly growing brain.',
  },
  {
    period: '400 KYA',
    title: 'Neanderthals',
    detail: 'Cold-adapted, social, deeply intelligent. Buried their dead and made jewellery.',
  },
  {
    period: '300 KYA',
    title: 'Homo sapiens',
    detail: 'Symbolic thought, language, art, music, agriculture — and eventually, the chair you’re sitting on.',
  },
]

const defaultSettings = {
  temperature: 52,
  rainfall: 64,
  oxygen: 70,
  predators: 41,
  mutation: 56,
  disease: 29,
  food: 73,
  water: 61,
}

const quizQuestions = [
  {
    prompt: 'Which process allows plants to turn sunlight into energy?',
    choices: ['Photosynthesis', 'Respiration', 'Hibernation', 'Erosion'],
    answer: 'Photosynthesis',
  },
  {
    prompt: 'Which group of animals dominated the Mesozoic era?',
    choices: ['Dinosaurs', 'Amphibians', 'Mammals', 'Insects'],
    answer: 'Dinosaurs',
  },
  {
    prompt: 'What happens during metamorphosis?',
    choices: ['An organism changes form dramatically', 'A plant creates seeds', 'The Earth cools down', 'A fish learns to fly'],
    answer: 'An organism changes form dramatically',
  },
]

function App() {
  const [settings, setSettings] = useState(defaultSettings)
  const [motionEnabled, setMotionEnabled] = useState(true)
  const [activeStages, setActiveStages] = useState(() => lifecycleSpecies.map(() => 0))
  const [activeSpecies, setActiveSpecies] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [activeSection, setActiveSection] = useState('journey')

  useEffect(() => {
    const sections = ['journey', 'ecosystem', 'life', 'human', 'quiz']
      .map((id) => document.getElementById(id))
      .filter(Boolean)
    const observer = new IntersectionObserver((entries) => {
      const visibleSection = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0]

      if (visibleSection) setActiveSection(visibleSection.target.id)
    }, { rootMargin: '-18% 0px -62% 0px', threshold: [0, 0.2, 0.5] })

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!motionEnabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const intervalId = window.setInterval(() => {
      setActiveStages((current) => current.map((stage, index) => (stage + 1) % lifecycleSpecies[index].stages.length))
    }, 2200)

    return () => window.clearInterval(intervalId)
  }, [motionEnabled])

  const ecosystemState = useMemo(() => {
    const temp = settings.temperature
    const rain = settings.rainfall
    const health = Math.round((rain + settings.oxygen + settings.food + (100 - settings.disease)) / 4)

    let mood = 'balanced'
    if (temp > 70 || settings.water < 35) mood = 'dry'
    if (rain > 75 && settings.temperature < 60) mood = 'lush'
    if (settings.predators > 70) mood = 'alert'
    if (health < 45) mood = 'stressed'

    return {
      mood,
      health,
      habitat: mood === 'lush' ? 'Rainforest bloom' : mood === 'dry' ? 'Sunlit savanna' : mood === 'alert' ? 'Watchful wilds' : 'Balanced tidepool',
    }
  }, [settings])

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: Number(value) }))
  }

  const selectedLifecycle = lifecycleSpecies[activeSpecies]
  const selectedStage = activeStages[activeSpecies]
  const updateLifecycleStage = (stageIndex) => {
    setActiveStages((current) => current.map((value, index) => index === activeSpecies ? stageIndex : value))
  }
  const moveLifecycleStage = (direction) => {
    const stageCount = selectedLifecycle.stages.length
    updateLifecycleStage((selectedStage + direction + stageCount) % stageCount)
  }
  const renderSlider = (key) => (
    <label className="slider-row" key={key}>
      <span>{key}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={settings[key]}
        onChange={(event) => updateSetting(key, event.target.value)}
      />
      <strong>{settings[key]}%</strong>
    </label>
  )

  return (
    <MotionConfig reducedMotion="user">
      <div className={motionEnabled ? 'origins-app' : 'origins-app motion-paused'}>
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark">O</span>
          <span>ORIGINS</span>
        </div>
        <nav className="main-nav">
          <a href="#journey" aria-current={activeSection === 'journey' ? 'location' : undefined}>Journey</a>
          <a href="#ecosystem" aria-current={activeSection === 'ecosystem' ? 'location' : undefined}>Ecosystem</a>
          <a href="#life" aria-current={activeSection === 'life' ? 'location' : undefined}>Life Cycles</a>
          <a href="#human" aria-current={activeSection === 'human' ? 'location' : undefined}>Humans</a>
          <a href="#quiz" aria-current={activeSection === 'quiz' ? 'location' : undefined}>Quiz</a>
        </nav>
        <button
          type="button"
          className="sound-toggle"
          aria-pressed={!motionEnabled}
          onClick={() => setMotionEnabled((value) => !value)}
        >
          {motionEnabled ? 'Pause motion' : 'Play motion'}
        </button>
      </header>

      <main>
        <section className="hero-section" id="journey">
          <div className="hero-backdrop" aria-hidden="true">
            <div className="sun-ray ray-1" />
            <div className="sun-ray ray-2" />
            <div className="sun-ray ray-3" />
            <div className="particle particle-1" />
            <div className="particle particle-2" />
            <div className="particle particle-3" />
            <div className="particle particle-4" />
            <div className="cloud cloud-1" />
            <div className="cloud cloud-2" />
            <div className="cloud cloud-3" />
          </div>

          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <span className="eyebrow">Earth evolution experience</span>
            <h1>ORIGINS</h1>
            <p className="hero-subtitle">Dive Through 4 Billion Years of Life on Earth</p>
            <div className="cta-row">
              <button type="button" onClick={() => document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' })}>Start the journey</button>
              <button type="button" className="secondary-button" onClick={() => document.getElementById('eras')?.scrollIntoView({ behavior: 'smooth' })}>Explore eras</button>
            </div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.2 }}
          >
            <div className="planet-scene">
              <div className="planet-ring ring-one" />
              <div className="planet-ring ring-two" />
              <div className="planet-core">
                <img
                  className="planet-photo"
                  src="https://www.solarsystemscope.com/spacepedia/images/handbook/renders/earth.png"
                  alt="Earth from space, image credit Apollo 8 crew and NASA"
                />
                <div className="planet-highlight" />
              </div>
              <div className="planet-clouds" />
              <div className="dna dna-a" />
              <div className="dna dna-b" />
            </div>
            <div className="floating-badge badge-one">
              <span>4.6B</span>
              <small>planet birth</small>
            </div>
            <div className="floating-badge badge-two">
              <span>3.5B</span>
              <small>microbes</small>
            </div>
          </motion.div>
        </section>

        <section className="story-overview" id="overview">
          <div className="section-heading">
            <span className="eyebrow mini">The long arc of life</span>
            <h2>From volcanic beginnings to a planet full of wonder.</h2>
          </div>
          <div className="overview-grid">
            <div>
              <strong>4.6 billion years</strong>
              <p>Earth formed from dust, heat, and collisions, then cooled into a world where oceans and continents began to change forever.</p>
            </div>
            <div>
              <strong>Massive shifts</strong>
              <p>Atmosphere, oceans, and ecosystems changed over time as life altered the planet in ways that continue today.</p>
            </div>
            <div>
              <strong>Life adapts</strong>
              <p>Every era brought a new balance of survival, extinction, and innovation as organisms evolved to fit a changing Earth.</p>
            </div>
          </div>
        </section>

        <section className="era-section" id="eras">
          {eraSections.map((era, index) => (
            <motion.article
              key={era.era}
              className={`era-panel era-${index + 1}`}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8 }}
            >
              <div className="era-visual" aria-hidden="true">
                <div className="era-photo" style={{ backgroundImage: `url(${era.image})` }} />
                <div className="sun-glow" style={{ background: era.accent }} />
                <div className="terrain terrain-back" />
                <div className="terrain terrain-mid" />
                <div className="terrain terrain-front" />
              </div>
              <div className="era-copy">
                <span className="era-label">{era.period}</span>
                <h3>{era.era}</h3>
                <p>{era.summary}</p>
                <ul>
                  {era.facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
                <span className="era-note">{era.text}</span>
              </div>
            </motion.article>
          ))}
        </section>

        <section className="simulator-section" id="ecosystem">
          <div className="simulator-intro">
            <div className="section-heading narrow">
              <span className="eyebrow mini">Interactive ecosystem lab</span>
              <h2>Shape a <em>living</em> world.</h2>
            </div>
            <p>Adjust climate and habitat conditions. Watch an ecosystem respond in real time.</p>
          </div>

          <div className="simulator-shell">
            <div className={`ecosystem-scene mood-${ecosystemState.mood}`} aria-label={`${ecosystemState.habitat}, ecosystem health ${ecosystemState.health}%`}>
              <div className="scene-sun" />
              <div className="scene-ridge ridge-back" />
              <div className="scene-ridge ridge-front" />
              <div className="scene-forest forest-back" />
              <div className="scene-forest forest-front" />
              <div className="scene-ground" />
              <div className="scene-pond">
                <span className="scene-animal scene-fish fish-a" aria-hidden="true">🐠</span>
                <span className="scene-animal scene-fish fish-b" aria-hidden="true">🐟</span>
                <span className="scene-ripple ripple-a" />
                <span className="scene-ripple ripple-b" />
              </div>
              <span className="scene-animal scene-rabbit" aria-hidden="true">🐇</span>
              <span className="scene-animal scene-frog" aria-hidden="true">🐸</span>
              <span className="scene-animal scene-bird bird-a" aria-hidden="true">🦜</span>
              <span className="scene-animal scene-bird bird-b" aria-hidden="true">🦜</span>
              <span className="scene-animal scene-butterfly butterfly-a" aria-hidden="true">🦋</span>
              <span className="scene-animal scene-butterfly butterfly-b" aria-hidden="true">🦋</span>
              <div className="scene-health">
                <span>Ecosystem health</span>
                <strong>{ecosystemState.health}% <small>{ecosystemState.mood}</small></strong>
                <span className="health-meter"><span style={{ width: `${ecosystemState.health}%` }} /></span>
              </div>
              <div className="habitat-tag">{ecosystemState.habitat}</div>
            </div>

            <div className="control-panel">
              <div className="console-heading">
                <div>
                  <span className="console-label">Console</span>
                  <h3>Climate dials</h3>
                </div>
                <button type="button" className="reset-settings" onClick={() => setSettings(defaultSettings)}>Reset</button>
              </div>
              <div className="slider-group">
                <span className="slider-group-label">Atmosphere</span>
                {Object.keys(defaultSettings).slice(0, 4).map(renderSlider)}
              </div>
              <div className="slider-group slider-group-ecology">
                <span className="slider-group-label">Habitat</span>
                {Object.keys(defaultSettings).slice(4).map(renderSlider)}
              </div>
              <div className="ecosystem-status">
                <div>
                  <small>Planet health</small>
                  <strong>{ecosystemState.health}%</strong>
                </div>
                <div>
                  <small>Ecosystem mood</small>
                  <strong>{ecosystemState.mood}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lifecycles-section" id="life">
          <div className="lifecycle-intro">
            <div className="section-heading narrow">
              <span className="eyebrow mini">Chapter 03 · Life cycles</span>
              <h2>A life, <em>unpacked.</em></h2>
            </div>
            <p>Choose a species. Follow its transformation from a single beginning to its place in a living ecosystem.</p>
          </div>

          <div className="species-selector" aria-label="Choose a species">
            {lifecycleSpecies.map((species, index) => (
              <button
                key={species.name}
                type="button"
                aria-pressed={activeSpecies === index}
                className={activeSpecies === index ? 'species-select active' : 'species-select'}
                onClick={() => setActiveSpecies(index)}
              >
                <LifecycleIllustration species={species.name} stageIndex={activeStages[index]} compact />
                <span>{species.name}</span>
              </button>
            ))}
          </div>

          <div className="lifecycle-explorer">
            <div className="cycle-visual" aria-label={`${selectedLifecycle.name} life cycle`}>
              <div className="cycle-orbit" aria-hidden="true" />
              {selectedLifecycle.stages.map((stage, stageIndex) => (
                <button
                  key={stage}
                  type="button"
                  className={`cycle-node cycle-node-${stageIndex + 1}${selectedStage === stageIndex ? ' active' : ''}`}
                  aria-label={`Show ${selectedLifecycle.name}: ${stage} stage`}
                  aria-pressed={selectedStage === stageIndex}
                  onClick={() => updateLifecycleStage(stageIndex)}
                >
                  <span>{stageIndex + 1}</span>
                  <small>{stage}</small>
                </button>
              ))}
              <div className="cycle-center">
                <motion.div
                  key={`${selectedLifecycle.name}-${selectedStage}`}
                  className="cycle-main-art"
                  initial={{ opacity: 0, scale: 0.62, rotate: -12, y: 8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                >
                  <LifecycleIllustration species={selectedLifecycle.name} stageIndex={selectedStage} />
                </motion.div>
                <span>{selectedLifecycle.name}</span>
              </div>
            </div>

            <div className="lifecycle-content">
              <div className="stage-gallery">
                {selectedLifecycle.stages.map((stage, stageIndex) => (
                  <button
                    key={stage}
                    type="button"
                    className={selectedStage === stageIndex ? 'stage-card active' : 'stage-card'}
                    aria-label={`Show ${selectedLifecycle.name}: ${stage} stage`}
                    aria-pressed={selectedStage === stageIndex}
                    onClick={() => updateLifecycleStage(stageIndex)}
                  >
                    <LifecycleIllustration species={selectedLifecycle.name} stageIndex={stageIndex} compact />
                    <span>{stageIndex + 1}. {stage}</span>
                  </button>
                ))}
              </div>
              <div className="stage-detail">
                <span className="stage-caption">Stage {selectedStage + 1} / {selectedLifecycle.stages.length}</span>
                <h3>{selectedLifecycle.stages[selectedStage]}</h3>
                <p>{selectedLifecycle.description}</p>
                <div className="stage-controls">
                  <button type="button" onClick={() => moveLifecycleStage(-1)}>← Previous</button>
                  <div className="stage-progress" aria-hidden="true">
                    {selectedLifecycle.stages.map((stage, index) => (
                      <span key={stage} className={index === selectedStage ? 'active' : ''} />
                    ))}
                  </div>
                  <button type="button" onClick={() => moveLifecycleStage(1)}>Next →</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="human-evolution-section" id="human">
          <div className="human-content">
            <div className="human-heading">
              <div className="human-title">
                <span className="eyebrow mini">Chapter four — Humans</span>
                <h1>From the savanna<br /><em>to the stars.</em></h1>
              </div>
              <p>Six million years. A handful of upright primates. A tool. A spark. A word. The slow, strange story of how we became us.</p>
            </div>
            <figure className="human-evolution-figure">
              <img
                src={humanEvolutionImage}
                alt="Illustration depicting ape-like and early human figures through to a modern human"
              />
            </figure>
            <div className="human-timeline">
              {humanEvolution.map((step, index) => (
                <motion.article
                  key={step.title}
                  className="human-step"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.18 + index * 0.1 }}
                >
                  <div className="step-copy">
                    <span className="step-period">{step.period}</span>
                    <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                    <h2>{step.title}</h2>
                    <p>{step.detail}</p>
                    <span className="step-rule" aria-hidden="true" />
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="catastrophe-section">
          <div className="catastrophe-panel">
            <figure className="asteroid-scene">
              <img
                src={asteroidImpactImage}
                alt="A rocky asteroid approaches the curved Earth, trailing fire toward a brilliant impact flare"
              />
            </figure>
            <div className="catastrophe-copy">
              <span className="eyebrow mini">Asteroid event</span>
              <h2>When an impact changed the course of life.</h2>
              <p>About 66 million years ago, a giant impact altered the atmosphere, triggered global fires, and caused ecosystems to collapse. Mammals survived and diversified, eventually giving rise to the world we know today.</p>
            </div>
          </div>
        </section>

        <section className="quiz-section" id="quiz">
          <div className="quiz-shell">
            <div className="quiz-copy">
              <span className="eyebrow mini">Challenge mode</span>
              <h2>Test what you’ve learned.</h2>
              <p>Answer the quick questions and celebrate the story of Earth.</p>
            </div>
            <div className="quiz-card">
              {quizQuestions.map((question, index) => (
                <div className="question-block" key={question.prompt}>
                  <h3>{index + 1}. {question.prompt}</h3>
                  <div className="choice-grid">
                    {question.choices.map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        className={selectedAnswers[index] === choice ? `choice ${choice === question.answer ? 'correct' : 'incorrect'}` : 'choice'}
                        aria-pressed={selectedAnswers[index] === choice}
                        onClick={() => setSelectedAnswers((current) => ({ ...current, [index]: choice }))}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                  {selectedAnswers[index] && (
                    <p className={`quiz-feedback ${selectedAnswers[index] === question.answer ? 'feedback-correct' : 'feedback-incorrect'}`} aria-live="polite">
                      {selectedAnswers[index] === question.answer ? 'Correct.' : `Not quite. The answer is ${question.answer}.`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="page-footer">
        <div>
          <span className="brand-mark">O</span>
          <span>ORIGINS</span>
        </div>
        <p>Life on Earth is a living story of adaptation, resilience, and wonder.</p>
      </footer>
      </div>
    </MotionConfig>
  )
}

export default App
