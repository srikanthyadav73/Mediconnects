import Link from "next/link";
import {
  HeartHandshake,
  Stethoscope,
  Phone,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  Baby,
  Activity,
  Mail,
  Syringe,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AppointmentRequestForm } from "@/components/shared/appointment-form";

export default function LandingPage() {
  const services = [
    {
      title: "General Pediatrics & OPD",
      desc: "Complete acute illness care, fever management, routine health assessments, and developmental milestone screening by senior pediatricians.",
      icon: Stethoscope,
      tag: "Outpatient Clinic",
    },
    {
      title: "Newborn & Neonatal NICU",
      desc: "Advanced Level-III neonatal intensive care for premature infants, newborn jaundice management, phototherapy, and specialized neonatal surgery.",
      icon: Baby,
      tag: "Critical Care",
    },
    {
      title: "Pediatric Pulmonology & Asthma",
      desc: "Comprehensive childhood asthma care, seasonal allergy desensitization, spirometry, and customized nebulization plans for wheezing.",
      icon: Activity,
      tag: "Specialty Clinic",
    },
    {
      title: "Childhood Immunization & Flu",
      desc: "WHO & IAP compliant digital vaccination schedule tracking with automatic WhatsApp alerts 24h before booster doses.",
      icon: Syringe,
      tag: "Preventive Care",
    },
    {
      title: "Growth, Nutrition & Milestones",
      desc: "Pediatric endocrinology, underweight child nutrition therapy, dietary counseling, and early intervention developmental therapy.",
      icon: Smile,
      tag: "Child Wellness",
    },
    {
      title: "24/7 Pediatric Emergency & Triage",
      desc: "Dedicated child-safe resuscitation suite, round-the-clock pediatric intensivists, trauma care, and rapid fever convulsion response.",
      icon: Clock,
      tag: "24/7 Emergency",
    },
  ];

  const doctors = [
    {
      name: "Dr. Ananya Roy",
      role: "Chief Pediatrician & Neonatologist",
      qualifications: "MD (Pediatrics), DCH, Fellowship in Neonatology (AIIMS)",
      experience: "16+ Years Experience",
      specialty: "High-risk newborns, infant developmental milestones, and pediatric intensive care.",
    },
    {
      name: "Dr. Rahul Deshpande",
      role: "Senior Consultant - Pediatric Pulmonology",
      qualifications: "MBBS, MD (Pediatrics), Pediatric Pulmonology (UK)",
      experience: "14+ Years Experience",
      specialty: "Childhood asthma, recurrent bronchitis, allergy screening, and sleep disorders.",
    },
    {
      name: "Dr. Meenakshi Sundaram",
      role: "Head of Behavioral & Developmental Pediatrics",
      qualifications: "MBBS, DNB (Pediatrics), Child Development Specialist",
      experience: "12+ Years Experience",
      specialty: "Speech delays, behavioral nutrition, sensory integration, and early school readiness.",
    },
    {
      name: "Dr. Tanvi Shah",
      role: "Consultant - Pediatric Surgery & Trauma",
      qualifications: "MBBS, MS (General Surgery), MCh (Pediatric Surgery)",
      experience: "10+ Years Experience",
      specialty: "Minimally invasive pediatric surgery, congenital corrections, and acute trauma.",
    },
  ];

  const testimonials = [
    {
      parent: "Priya & Rajesh Sharma",
      child: "Parents of Aarav (Age 5)",
      quote:
        "When Aarav had persistent wheezing and high fever at midnight, the emergency pediatric team at CareBridge had him stabilized within 15 minutes. The WhatsApp medication alerts over the next 4 days ensured we never missed an antibiotic dose.",
      location: "Bandra West, Mumbai",
    },
    {
      parent: "Sneha Kulkarni",
      child: "Mother of Aditi (Age 3)",
      quote:
        "The child-friendly environment immediately put my daughter at ease. Dr. Roy took 30 minutes to explain her nutritional chart. Booking via WhatsApp and receiving digital prescriptions right on my phone is revolutionary.",
      location: "Thane, Mumbai",
    },
    {
      parent: "Vikram Malhotra",
      child: "Father of Kabir (Age 8)",
      quote:
        "CareBridge is without question the most organized children’s hospital in Mumbai. Clean rooms, transparent billing with zero surprise fees, and doctors who truly listen to parents.",
      location: "Juhu, Mumbai",
    },
  ];

  const faqs = [
    {
      question: "How does the WhatsApp appointment reminder system work?",
      answer:
        "Once your appointment is confirmed, our automated WhatsApp integration sends you a calendar notification. You will receive an automated 24-hour reminder with parking and token details, plus a 2-hour reminder on consultation day. You can confirm or reschedule right from WhatsApp.",
    },
    {
      question: "What should I do in case of a nighttime pediatric emergency?",
      answer:
        "Our 24/7 Pediatric Emergency Unit at Bandra West is always staffed by on-duty pediatric intensivists and pediatric nurses. No prior appointment is required for emergency triage. You can also dial our emergency helpline directly: +91 22 2654 8900.",
    },
    {
      question: "Are your vaccination schedules compliant with Indian Academy of Pediatrics (IAP)?",
      answer:
        "Yes, our immunization center strictly adheres to both IAP (Indian Academy of Pediatrics) and WHO guidelines. We maintain cold-chain verified vaccines with digital batch tracking and automatic WhatsApp booster reminders.",
    },
    {
      question: "What cashless insurance and TPA options are accepted?",
      answer:
        "We support all major health insurance providers (Star Health, HDFC ERGO, ICICI Lombard, Care Health, Niva Bupa) with on-spot TPA desk assistance for cashless pediatric admissions.",
    },
    {
      question: "What is your consultation fee structure?",
      answer:
        "Standard pediatric general OPD consultation is ₹600. Follow-up reviews within 7 days are provided at concessional rates or complimentary depending on the treatment plan.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground scroll-smooth">
      {/* 1. STICKY TOP NAVIGATION */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <HeartHandshake className="h-5 w-5 text-accent" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-foreground flex items-center gap-1.5">
                CareBridge
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Children&apos;s Hospital
                </span>
              </span>
              <p className="text-[10px] text-muted-foreground font-medium hidden sm:block">
                Center for Pediatric Excellence • Mumbai
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a href="#services" className="hover:text-foreground transition-colors">
              Specialties
            </a>
            <a href="#doctors" className="hover:text-foreground transition-colors">
              Our Pediatricians
            </a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">
              Parent Reviews
            </a>
            <a href="#faqs" className="hover:text-foreground transition-colors">
              FAQs
            </a>
            <a href="#contact" className="hover:text-foreground transition-colors">
              Contact &amp; Map
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/login">Staff Portal</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs shadow-md font-semibold"
            >
              <a href="#appointment-form">Book Appointment</a>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/60 via-background to-background py-16 sm:py-24 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline and Badges */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span>NABH Accredited Pediatric Center &bull; Mumbai</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                Compassionate Pediatric Care,{" "}
                <span className="text-primary underline decoration-accent decoration-wavy decoration-2">
                  Connected Seamlessly
                </span>{" "}
                Via WhatsApp.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Dedicated exclusively to children from newborn to 16 years. Experienced pediatricians, child-friendly OPDs, zero-wait triage, and instant appointment updates directly on your phone.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg text-sm px-6"
                >
                  <a href="#appointment-form">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Pediatric Appointment
                  </a>
                </Button>

                <Button asChild size="lg" variant="outline" className="text-sm px-5 border-border">
                  <a href="tel:+912226548900" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>24/7 Helpline: (022) 2654 8900</span>
                  </a>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-border/60 grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <div className="text-2xl font-bold text-foreground">45,000+</div>
                  <div className="text-xs text-muted-foreground font-medium">Children Treated</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">4.9 ★</div>
                  <div className="text-xs text-muted-foreground font-medium">1,200+ Parent Reviews</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">15 Mins</div>
                  <div className="text-xs text-muted-foreground font-medium">Average OPD Wait Time</div>
                </div>
              </div>
            </div>

            {/* Right Column: Appointment Form */}
            <div className="lg:col-span-5">
              <AppointmentRequestForm />
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUST STATS STRIP */}
      <section className="py-10 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-accent">18+</div>
              <div className="text-xs font-medium text-primary-foreground/90">
                Super-Specialist Pediatricians
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-white">99.4%</div>
              <div className="text-xs font-medium text-primary-foreground/90">
                Timely Vaccination Coverage
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-accent">24/7</div>
              <div className="text-xs font-medium text-primary-foreground/90">
                Pediatric Emergency Triage Desk
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-white">100%</div>
              <div className="text-xs font-medium text-primary-foreground/90">
                Digital WhatsApp Appointment Sync
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SERVICES & SPECIALTIES */}
      <section id="services" className="py-20 bg-muted/20 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <Badge variant="outline" className="text-xs font-semibold">
              Pediatric Excellence
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Comprehensive Medical Care Tailored for Children
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              From routine newborn milestones to complex childhood pulmonary and allergic conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card
                  key={service.title}
                  className="hover:border-primary/50 transition-all hover:shadow-md bg-card"
                >
                  <CardHeader className="space-y-2 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="text-[10px] py-0 px-2">
                        {service.tag}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {service.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. DOCTORS & SPECIALISTS */}
      <section id="doctors" className="py-20 border-t border-border/80 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <Badge variant="outline" className="text-xs font-semibold">
              Clinical Team
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Meet Our Senior Pediatric Consultants
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Trained at premier medical institutes with dedicated careers focused exclusively on pediatric medicine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((doctor) => (
              <Card key={doctor.name} className="shadow-xs hover:shadow-md transition-shadow">
                <CardHeader className="space-y-1.5 pb-2">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-base mb-2">
                    {doctor.name.split(" ")[1]?.[0] || "D"}
                  </div>
                  <CardTitle className="text-base font-bold text-foreground">
                    {doctor.name}
                  </CardTitle>
                  <p className="text-xs font-semibold text-primary">{doctor.role}</p>
                  <Badge variant="secondary" className="text-[10px] w-fit">
                    {doctor.experience}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p className="text-muted-foreground font-mono text-[11px]">
                    {doctor.qualifications}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    {doctor.specialty}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PARENT TESTIMONIALS */}
      <section id="testimonials" className="py-20 bg-muted/30 border-t border-border/80 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <Badge variant="coral" className="text-xs font-semibold">
              Parent Stories
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Trusted by Over 45,000 Families Across Mumbai
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Real experiences from parents whose children received care at CareBridge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.parent} className="shadow-xs bg-card">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex text-amber-500 gap-1 text-sm">
                    {"★".repeat(5)}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="pt-2 border-t border-border/60">
                    <p className="text-xs font-bold text-foreground">{t.parent}</p>
                    <p className="text-[11px] text-primary font-medium">{t.child}</p>
                    <p className="text-[10px] text-muted-foreground">{t.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ ACCORDION */}
      <section id="faqs" className="py-20 border-t border-border/80 scroll-mt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <Badge variant="outline" className="text-xs font-semibold">
              Questions &amp; Answers
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Everything you need to know about clinic visits, appointments, and WhatsApp updates.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index}`}>
                <AccordionTrigger className="text-xs sm:text-sm font-semibold text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 8. CONTACT & LOCATION */}
      <section id="contact" className="py-20 bg-muted/20 border-t border-border/80 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="text-xs font-semibold mb-2">
                  Hospital Location &amp; Timings
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  CareBridge Children&apos;s Hospital
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Centrally located in Bandra West with dedicated pediatric valet parking and wheelchair access.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">Address:</span>
                    <span className="text-muted-foreground">
                      CareBridge Medical Tower, Plot 42, S.V. Road, Near Bandra Station, Bandra West, Mumbai, Maharashtra 400050
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">Phone &amp; WhatsApp:</span>
                    <span className="text-muted-foreground">
                      OPD Appointments: +91 22 2654 8900 | WhatsApp Desk: +91 98200 11000
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">Operating Hours:</span>
                    <span className="text-muted-foreground">
                      Outpatient Consultations: Monday &ndash; Saturday, 8:00 AM &ndash; 9:00 PM<br />
                      Pediatric Emergency &amp; Neonatal Triage: Open 24 Hours, 365 Days
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">Clinical Inquiries:</span>
                    <span className="text-muted-foreground">care@carebridge.in</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Locator Card */}
            <Card className="p-6 bg-card border-border shadow-md">
              <div className="aspect-video w-full rounded-lg bg-teal-900/10 dark:bg-teal-950/40 border border-teal-500/20 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <MapPin className="h-10 w-10 text-accent animate-bounce" />
                <div>
                  <p className="text-sm font-bold text-foreground">
                    CareBridge Pediatric Medical Tower
                  </p>
                  <p className="text-xs text-muted-foreground">
                    S.V. Road, Bandra West, Mumbai 400050
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <a
                    href="https://maps.google.com/?q=Bandra+West+Mumbai"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Google Maps
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="border-t border-border py-12 bg-card text-card-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-border/80 text-xs">
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  CB
                </div>
                <span className="font-bold text-sm tracking-tight text-foreground">
                  CareBridge
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Integrated Pediatric Healthcare, Clinical CRM, and WhatsApp Patient Engagement Platform.
              </p>
              <div className="text-[11px] text-muted-foreground">
                Reg. No: MH-BOM-MED-2026-9812
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-foreground text-xs uppercase tracking-wider">
                Clinical Services
              </p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>Pediatric OPD Consultation</li>
                <li>Neonatal Intensive Care (NICU)</li>
                <li>Childhood Immunization</li>
                <li>Pediatric Pulmonology &amp; Asthma</li>
                <li>Growth &amp; Nutrition Assessments</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-foreground text-xs uppercase tracking-wider">
                Patient Resources
              </p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><a href="#appointment-form" className="hover:text-foreground">Book Appointment</a></li>
                <li><a href="#faqs" className="hover:text-foreground">Patient FAQs</a></li>
                <li>Emergency Triage Guidelines</li>
                <li>IAP Vaccination Schedule</li>
                <li>Cashless Insurance TPAs</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-foreground text-xs uppercase tracking-wider">
                Hospital Administration
              </p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>
                  <Link href="/login" className="text-primary font-semibold hover:underline">
                    Staff &amp; Doctor Login →
                  </Link>
                </li>
                <li>Clinical Audit Log</li>
                <li>Privacy &amp; Data Security Notice</li>
                <li>Patient Consent Framework</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} CareBridge Children&apos;s Hospital. All rights reserved.</p>
            <p>Designed for Indian Pediatric Healthcare • E.164 WhatsApp Compliant • NABH Certified</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
