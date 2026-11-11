import Hero from '../sections/Hero';
import History from '../sections/History';
import Weekend from '../sections/Weekend';
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
      <Machine />
      <Teams />
      <Drivers />
      <Stats />
      <Footer />
    </>
  );
}
