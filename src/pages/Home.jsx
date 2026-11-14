import Hero from '../sections/Hero';
import History from '../sections/History';
import Weekend from '../sections/Weekend';
import Pitstop from '../sections/Pitstop';
import Tyres from '../sections/Tyres';
import Machine from '../sections/Machine';
import Teams from '../sections/Teams';
import Drivers from '../sections/Drivers';
import Stats from '../sections/Stats';
import Footer from '../components/Footer';

export default function Home({ booted }) {
  return (
    <>
      <Hero booted={booted} />
      <History />
      <Weekend />
      <Pitstop />
      <Tyres />
      <Machine />
      <Teams />
      <Drivers />
      <Stats />
      <Footer />
    </>
  );
}
