import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const plans = [
  {name:'Free', price:'OMR 0', desc:'Explore Oman opportunities', features:['Limited tender feed','Basic search','5 saved tenders']},
  {name:'Starter', price:'OMR 9', desc:'For individual bidders', features:['Full tender search','Email deadline alerts','50 saved tenders','Basic company matching']},
  {name:'Pro', price:'OMR 25', desc:'For active contractors', featured:true, features:['AI tender summaries','Eligibility analysis','Personalized match score','Unlimited saved tenders','Priority alerts']},
  {name:'Business', price:'OMR 59', desc:'For tender teams', features:['Everything in Pro','Up to 10 users','Multiple company profiles','Exports & reports','Team workspace']}
];

function App(){
 return <div className="app">
  <header className="nav"><div className="brand"><span className="mark">OT</span><span>Oman Tender <b>Intelligence</b></span></div><nav><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#how">How it works</a></nav><div className="actions"><button className="ghost">Sign in</button><button className="primary">Start free</button></div></header>
  <main>
   <section className="hero"><div className="eyebrow">OMAN PROCUREMENT INTELLIGENCE</div><h1>Find the tenders<br/><span>worth bidding for.</span></h1><p>One focused workspace for Oman contractors to discover relevant tenders, understand requirements, and act before deadlines.</p><div className="heroBtns"><button className="primary big">Start free →</button><button className="ghost big">See how it works</button></div><div className="trust"><span>✓ Oman-focused</span><span>✓ Relevance scoring</span><span>✓ Deadline alerts</span><span>✓ AI analysis</span></div></section>
   <section className="stats"><div><strong>Live</strong><small>tender intelligence</small></div><div><strong>AI</strong><small>bid relevance scoring</small></div><div><strong>24/7</strong><small>deadline monitoring</small></div><div><strong>1</strong><small>workspace for your team</small></div></section>
   <section id="features" className="section"><div className="sectionHead"><div><div className="eyebrow">BUILT FOR CONTRACTORS</div><h2>From tender discovery<br/>to bid decision.</h2></div><p>Stop wasting hours scanning procurement portals. Get the opportunities that fit your business, with the context you need to decide.</p></div><div className="featureGrid"><Feature icon="◈" title="Personalized matching" text="Tell us your sectors, capabilities and preferred contract size. Every new tender gets a relevance score."/><Feature icon="⌕" title="Smart discovery" text="Search across your Oman tender sources from one clean workspace with practical filters."/><Feature icon="✦" title="AI tender analysis" text="Summarize scope, requirements, deadlines and eligibility before your team spends time on the documents."/><Feature icon="◷" title="Deadline intelligence" text="Keep critical submission dates visible and receive timely alerts for saved opportunities."/><Feature icon="▣" title="Company profile" text="Build a reusable company capability profile to improve recommendations and qualification checks."/><Feature icon="↗" title="Team workflow" text="Save, review and share opportunities with your tender team as the product grows."/></div></section>
   <section id="how" className="how"><div className="eyebrow">HOW IT WORKS</div><h2>Three steps to a smarter bid pipeline.</h2><div className="steps"><Step n="01" title="Create your company profile" text="Choose sectors, capabilities, locations and bid preferences."/><Step n="02" title="Get matched opportunities" text="New Oman tenders are scored against your profile so high-fit opportunities stand out."/><Step n="03" title="Analyze & act" text="Open the tender, review AI insights, save it and keep the deadline on your radar."/></div></section>
   <section id="pricing" className="pricing"><div className="eyebrow">SIMPLE PRICING</div><h2>Start free. Upgrade when<br/>tender volume grows.</h2><div className="plans">{plans.map(p=><div className={'plan '+(p.featured?'featured':'')} key={p.name}>{p.featured&&<div className="popular">MOST POPULAR</div>}<h3>{p.name}</h3><p>{p.desc}</p><div className="price">{p.price}<small>/ month</small></div><button className={p.featured?'primary':'outline'}>{p.name==='Free'?'Get started':'Choose '+p.name}</button><ul>{p.features.map(f=><li key={f}>✓ {f}</li>)}</ul></div>)}</div></section>
   <section className="cta"><div><div className="eyebrow">READY TO BID BETTER?</div><h2>Put Oman tender intelligence<br/>to work for your company.</h2></div><button className="primary big">Create free account →</button></section>
  </main><footer><span>© 2026 Oman Tender Intelligence</span><span>Commercial SaaS • Oman</span></footer>
 </div>
}
const Feature=({icon,title,text})=><div className="feature"><div className="icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>;
const Step=({n,title,text})=><div className="step"><div className="num">{n}</div><h3>{title}</h3><p>{text}</p></div>;
createRoot(document.getElementById('root')).render(<App/>);
