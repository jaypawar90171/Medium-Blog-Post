import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Stats from '../components/Stats'
import Discover from '../components/Discover'
import Write from '../components/Write'
import Membership from '../components/Membership'
import Footer from '../components/Footer'

const Landing = () => {
    return (
        <div className="min-h-screen bg-paper">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Discover />
        <Write />
        <Membership />
      </main>
      <Footer />
    </div>
    )
}
export default Landing
