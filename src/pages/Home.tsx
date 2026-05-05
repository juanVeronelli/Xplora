import { useState, useEffect } from 'react';
import type { Page } from '../types';
import type { Evento } from '../types';
import Hero from '../components/Hero';
import CompanyMarquee from '../components/CompanyMarquee';
import ProximoEvento from '../components/ProximoEvento';
import VideoSection from '../components/VideoSection';
import Carousel from '../components/Carousel';
import Valores from '../components/Valores';
import SponsorsOfficial from '../components/SponsorsOfficial';
import Newsletter from '../components/Newsletter';
import Footer from '../components/Footer';
import { useIsMobile } from '../hooks/useIsMobile';
import { fetchEventos } from '../lib/db';
import { pickEarliestUpcoming } from '../lib/eventDate';

interface Props {
  goTo: (p: Page) => void;
  openEvento: (e: Evento) => void;
}

export default function Home({ goTo, openEvento }: Props) {
  const isMobile = useIsMobile();
  const [proximo, setProximo] = useState<Evento | null>(null);

  useEffect(() => {
    fetchEventos().then(list => {
      setProximo(pickEarliestUpcoming(list));
    });
  }, []);

  const divider: React.CSSProperties = {
    height: 1,
    background: 'var(--border-warm)',
    margin: isMobile ? '0 24px' : '0 80px',
  };

  return (
    <>
      <Hero goTo={goTo} />
      <CompanyMarquee />

      {proximo && (
        <>
          <ProximoEvento evento={proximo} openEvento={openEvento} goTo={goTo} />
          <div style={divider} />
        </>
      )}

      <VideoSection goTo={goTo} />

      <div style={divider} />
      <Carousel />

      <div style={divider} />
      <Valores />

      <div style={divider} />
      <SponsorsOfficial />

      <Newsletter />
      <Footer goTo={goTo} />
    </>
  );
}
