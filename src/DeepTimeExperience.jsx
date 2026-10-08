import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './DeepTime.css'

const eras = [
  {
    id: 'hadean',
    name: 'Hadean',
    span: '4.6–4.0 billion years ago',
    age: '4.6 BYA',
    descriptor: 'A world still becoming',
    summary:
      'Earth began as a storm of colliding rock. The young planet glowed with impact heat, its surface repeatedly melted and remade beneath a sky with no oxygen to breathe.',
    details: ['The Moon forms after a giant impact', 'A global magma ocean slowly cools', 'The oldest minerals hint at early water'],
    key: 'hadean',
    accessibleLabel: 'Molten, newly formed Earth, with glowing volcanic fissures',
  },
  {
    id: 'paleozoic',
    name: 'Paleozoic',
    span: '541–252 million years ago',
    age: '541 MYA',
    descriptor: 'Life finds its footing',
    summary:
      'Life diversified in the oceans, then ventured onto land. Reefs, forests, insects, and the first four-limbed vertebrates transformed a planet once ruled by microbes.',
    details: ['The Cambrian explosion fills the seas', 'Plants and animals colonize land', 'Pangaea gathers the continents together'],
    key: 'paleozoic',
    accessibleLabel: 'Blue-green Earth with shallow seas and early landmasses',
  },
  {
    id: 'mesozoic',
    name: 'Mesozoic',
    span: '252–66 million years ago',
    age: '252 MYA',
    descriptor: 'A supercontinent breaks apart',
    summary:
      'Dinosaurs rose as Pangaea split into new continents. Reptiles ruled land and sea, while flowering plants appeared and began changing the shape of ecosystems.',
    details: ['Dinosaurs diversify across the continents', 'Pangaea fractures into Laurasia and Gondwana', 'A mass extinction closes the era'],
    key: 'mesozoic',
    accessibleLabel: 'Lush green supercontinent surrounded by deep blue ocean',
  },
  {
    id: 'cenozoic',
    name: 'Cenozoic',
    span: '66 million years ago–today',
    age: '66 MYA',
    descriptor: 'The living world we know',
    summary:
      'After the extinction of the non-avian dinosaurs, mammals and birds flourished. Continents reached familiar positions, climates shifted, and humans became a planetary force.',
    details: ['Mammals radiate into newly open habitats', 'Grasslands and ice ages reshape the surface', 'One species begins to alter the whole planet'],
    key: 'cenozoic',
    accessibleLabel: 'Modern blue Earth with green continents and cloud bands',
  },
]

function DeepTimeExperience() {
  const timelineRef = useRef(null)
  const cardRefs = useRef([])
  const progressRef = useRef(null)
  const earthRef = useRef(null)
  const [activeEra, setActiveEra] = useState(0)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const context = gsap.context(() => {
      cardRefs.current.forEach((card, index) => {
        if (!card) return

        ScrollTrigger.create({
          trigger: card,
          start: 'top 58%',
          end: 'bottom 42%',
          onEnter: () => setActiveEra(index),
          onEnterBack: () => setActiveEra(index),
        })
      })

      ScrollTrigger.create({
        trigger: timelineRef.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (trigger) => {
          gsap.to(progressRef.current, {
            scaleY: trigger.progress,
            duration: 0.24,
            overwrite: true,
          })
        },
      })

      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.fromTo(
          earthRef.current,
          { autoAlpha: 0, scale: 0.88 },
          { autoAlpha: 1, scale: 1, duration: 1.3, delay: 0.2, ease: 'power3.out' },
        )
      }
    }, timelineRef)

    return () => context.revert()
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.to('.surface-layer', {
      rotation: activeEra * 7,
      duration: 1.5,
      ease: 'power2.inOut',
      transformOrigin: '50% 50%',
      stagger: 0.035,
    })
  }, [activeEra])

  return (
    <div className="deep-time-app">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Origins, return to start">
          <span className="wordmark-symbol" aria-hidden="true">O</span>
          <span>ORIGINS <small>DEEP TIME ARCHIVE</small></span>
        </a>
        <a className="header-link" href="#cenozoic">JUMP TO TODAY <span aria-hidden="true">↘</span></a>
      </header>

      <main id="top" className="timeline-layout" ref={timelineRef}>
        <aside className={`timeline-visual era-${eras[activeEra].key}`} aria-label="Earth through geological time">
          <div className="visual-stars" aria-hidden="true" />
          <div className="visual-heading">
            <span className="eyebrow"><i /> FIELD NOTES / 01—04</span>
            <h1>One planet.<br /><em>Deep time.</em></h1>
            <p>4.6 billion years of becoming.</p>
          </div>

          <div className="earth-stage">
            <div className="orbit orbit-wide" aria-hidden="true" />
            <div className="orbit orbit-tight" aria-hidden="true" />
            <div className="earth-halo" aria-hidden="true" />
            <div className="earth-orb" ref={earthRef} role="img" aria-label={eras[activeEra].accessibleLabel}>
              <div className="earth-texture">
                <div className="surface-layer surface-hadean" />
                <div className="surface-layer surface-paleozoic" />
                <div className="surface-layer surface-mesozoic" />
                <div className="surface-layer surface-cenozoic" />
                <div className="surface-clouds" />
              </div>
              <div className="earth-shadow" />
              <div className="earth-atmosphere" />
            </div>
            <span className="orbital-label label-01">H₂O <i /></span>
            <span className="orbital-label label-02"><i /> 4.6° N</span>
          </div>

          <div className="visual-caption" aria-live="polite">
            <span className="caption-index">0{activeEra + 1} / 04</span>
            <span className="caption-name">{eras[activeEra].name}</span>
            <span className="caption-age">{eras[activeEra].age}</span>
          </div>

          <nav className="time-rail" aria-label="Timeline navigation">
            <div className="rail-track" aria-hidden="true"><span className="rail-fill" ref={progressRef} /></div>
            {eras.map((era, index) => (
              <a
                key={era.id}
                href={`#${era.id}`}
                className={activeEra === index ? 'rail-stop is-active' : 'rail-stop'}
                aria-label={`Go to ${era.name}, ${era.span}`}
                aria-current={activeEra === index ? 'step' : undefined}
              >
                <span className="rail-dot" />
                <span className="rail-age">{era.age}</span>
              </a>
            ))}
            <span className="rail-endpoint">TODAY</span>
          </nav>

          <div className="visual-footnote"><span>FIG. 001</span><span>EARTH / SOL III</span></div>
        </aside>

        <section className="era-stack" aria-label="Four chapters in Earth's history">
          {eras.map((era, index) => (
            <article
              className={`era-card${activeEra === index ? ' is-active' : ''}`}
              id={era.id}
              key={era.id}
              ref={(element) => { cardRefs.current[index] = element }}
              aria-labelledby={`${era.id}-title`}
            >
              <div className="card-topline">
                <span>CHAPTER 0{index + 1}</span>
                <span>{era.span}</span>
              </div>
              <div className="card-content">
                <span className="era-kicker"><i /> {era.descriptor}</span>
                <h2 id={`${era.id}-title`}>{era.name}<span className="title-period">.</span></h2>
                <p className="era-summary">{era.summary}</p>
                <ul className="era-details">
                  {era.details.map((detail) => <li key={detail}>{detail}</li>)}
                </ul>
              </div>
              <div className="card-bottomline">
                <span>THE EARTH STORY</span>
                <span>0{index + 1} <i /> 04</span>
              </div>
            </article>
          ))}
        </section>
      </main>

      <footer className="site-footer">
        <span>EVERYTHING THAT LIVES IS PART OF THIS STORY.</span>
        <span>ORIGINS <i /> EARTH / 4.6 GA</span>
      </footer>
    </div>
  )
}

export default DeepTimeExperience