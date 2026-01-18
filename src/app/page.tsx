"use client";

import Link from "next/link";

/**
 * Landing Page - Premium Patient Portal
 * High-trust hero section with "Book Appointment" as primary CTA
 */
export default function Home() {
  return (
    <div className="page-gradient">
      {/* Utility Header */}
      <div className="utility-header">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="#" className="hover:underline">Find a Location</a>
            <a href="#" className="hover:underline">Insurance Accepted</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:underline">My Health</a>
            <a href="#" className="hover:underline">Sign In</a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0066CC] to-[#0055A4] flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Emi Health</h1>
              <p className="text-xs text-slate-500">Virtual Care</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-slate-600 hover:text-[#0055A4] font-medium transition-colors">Services</a>
            <a href="#how-it-works" className="text-slate-600 hover:text-[#0055A4] font-medium transition-colors">How It Works</a>
            <a href="#about" className="text-slate-600 hover:text-[#0055A4] font-medium transition-colors">About</a>
          </nav>

          <Link href="/book" className="btn-primary">
            Book Appointment
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm font-medium text-blue-700">Now accepting new patients</span>
              </div>

              <h2 className="text-5xl lg:text-6xl font-bold text-slate-800 leading-tight mb-6">
                Quality care,<br />
                <span className="bg-gradient-to-r from-[#0055A4] to-[#0066CC] bg-clip-text text-transparent">
                  right around the corner
                </span>
              </h2>

              <p className="text-xl text-slate-500 mb-10 max-w-lg leading-relaxed">
                Skip the wait. Book an appointment and complete your AI-powered pre-screening
                from home. Get connected to care faster than ever.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/book" className="btn-cta">
                  <span>Book Appointment</span>
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <button className="btn-secondary">
                  <svg className="w-5 h-5 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Find a Clinic
                </button>
              </div>

              {/* Trust indicators */}
              <div className="mt-12 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-600">HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-600">Board-Certified Providers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-600">Same-Day Appointments</span>
                </div>
              </div>
            </div>

            {/* Right: Hero Image/Illustration */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main card - Doctor Team Image */}
                <div className="premium-card p-8">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden">
                    <img 
                      src="/doctors-team.jpg" 
                      alt="Medical team of doctors in white coats discussing patient care in a modern hospital setting"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Floating cards */}
                <div className="absolute -top-4 -right-4 premium-card p-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">AI Pre-Screening</p>
                      <p className="text-xs text-slate-500">Complete before visit</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 premium-card p-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Avg. Wait Time</p>
                      <p className="text-xs text-emerald-600 font-medium">Under 5 minutes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-slate-800 mb-4">
              Our Services
            </h3>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Choose the care that fits your needs. All services include AI-powered pre-screening for faster, more personalized care.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href="/book?service=general_checkup" className="premium-card-hover p-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-slate-800 mb-2">General Checkup</h4>
              <p className="text-slate-500 mb-4">
                Routine wellness visits, preventive care, and health screenings. Perfect for maintaining your overall health.
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                <span>Book now</span>
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link href="/book?service=urgent_care" className="premium-card-hover p-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-slate-800 mb-2">Urgent Care</h4>
              <p className="text-slate-500 mb-4">
                For non-emergency issues that need quick attention. Colds, minor injuries, infections, and more.
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                <span>Book now</span>
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-slate-800 mb-4">
              How It Works
            </h3>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Get care in three simple steps. Our AI-powered intake makes your visit more efficient.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="premium-card text-center">
              <div className="step-indicator-active mx-auto mb-6">1</div>
              <h4 className="text-lg font-semibold text-slate-800 mb-3">Book Online</h4>
              <p className="text-slate-500">
                Choose your service, select a convenient time slot, and provide your basic information.
              </p>
            </div>

            <div className="premium-card text-center">
              <div className="step-indicator-active mx-auto mb-6">2</div>
              <h4 className="text-lg font-semibold text-slate-800 mb-3">AI Pre-Screening</h4>
              <p className="text-slate-500">
                Complete your virtual intake with Emi, our AI assistant. Share symptoms and upload any relevant images.
              </p>
            </div>

            <div className="premium-card text-center">
              <div className="step-indicator-active mx-auto mb-6">3</div>
              <h4 className="text-lg font-semibold text-slate-800 mb-3">See Your Provider</h4>
              <p className="text-slate-500">
                Your provider reviews your pre-screening data, making your visit faster and more focused.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/book" className="btn-primary">
              Get Started
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-[#0055A4] mb-2">50K+</p>
              <p className="text-slate-500">Patients Served</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-[#0055A4] mb-2">4.9</p>
              <p className="text-slate-500">Patient Rating</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-[#0055A4] mb-2">&lt;5min</p>
              <p className="text-slate-500">Average Wait</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-[#0055A4] mb-2">100+</p>
              <p className="text-slate-500">Providers</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#0055A4] to-[#003D7A]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to experience better healthcare?
          </h3>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Book your appointment today and see why thousands of patients choose Emi Health for their care.
          </p>
          <Link href="/book" className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold text-[#0055A4] text-lg bg-white hover:bg-blue-50 transition-all duration-200 shadow-xl">
            Book Your Appointment
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0066CC] to-[#0055A4] flex items-center justify-center">
                  <span className="text-white font-bold text-xl">E</span>
                </div>
                <span className="text-white font-bold text-lg">Emi Health</span>
              </div>
              <p className="text-sm">
                Quality virtual care, right around the corner.
              </p>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Services</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">General Checkup</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Urgent Care</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mental Health</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Prescription Refills</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Company</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Legal</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">HIPAA Notice</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Emi Health. For demonstration purposes only.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
