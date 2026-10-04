# Local Eye

## Product Overview

**Local Eye** is a mobile-friendly web application that helps parents quickly discover kid-friendly events and activities happening nearby.

The initial launch market is the **Seacoast region of Southern Maine and New Hampshire**, including areas such as Portsmouth, Dover, Kittery, York, Eliot, South Berwick, Durham, Exeter, Hampton, Rye, Greenland, Stratham, and surrounding communities.

The core problem is that local family activities are fragmented across Facebook, Instagram, library calendars, recreation departments, museums, town websites, farms, local publications, and individual business websites.

Local Eye should answer one simple question:

**"What can I do with my kid today?"**

Rather than displaying a huge generic event calendar, Local Eye should filter and rank activities based on what is actually relevant to the family.

---

## Target User

The initial user is a parent or caregiver of young children living in or visiting the Seacoast.

Example:

- Parent has a 2-year-old
- Lives in the Seacoast
- Wants something to do Saturday morning
- Doesn't want to drive more than 25 minutes
- Wants to spend less than $20
- May need an indoor activity if it is raining

The user should be able to find appropriate options in seconds instead of searching multiple websites and social media accounts.

---

## Core MVP Experience

The home page should prominently ask:

**What should we do?**

Allow the user to provide:

- Child's age
- Date:
  - Today
  - Tomorrow
  - This weekend
  - Custom date
- Time:
  - Morning
  - Afternoon
  - Evening
  - Anytime
- Maximum driving distance
- Budget:
  - Free
  - Under $10
  - Under $20
  - Any
- Environment:
  - Indoor
  - Outdoor
  - Either

Then display a small number of highly relevant results rather than a giant calendar.

---

## Event Results

Each result should display:

- Event/activity name
- Image if available
- Venue
- Town
- Date
- Start/end time
- Appropriate ages
- Price
- Free indicator
- Indoor/outdoor
- Approximate distance
- Registration requirement
- Registration link
- Original source
- Short description

Users should be able to save/favorite activities.

Always preserve the original source URL so users can verify details and register with the actual organizer.

---

## Event Data Model

An event should support approximately:

- id
- title
- description
- venueName
- address
- city
- state
- latitude
- longitude
- startDateTime
- endDateTime
- minAge
- maxAge
- priceMin
- priceMax
- isFree
- indoorOutdoor
- category
- registrationRequired
- registrationUrl
- imageUrl
- sourceName
- sourceUrl
- lastVerifiedAt
- createdAt
- updatedAt

Possible categories:

- Storytime
- Museum
- Playground
- Festival
- Farm
- Nature
- Arts & Crafts
- Music
- Sports
- Open Gym
- Educational
- Seasonal
- Community Event
- Other

---

## Event Sources

The eventual system should aggregate events from multiple sources.

Initial sources should prioritize structured, reliable local calendars such as:

- Public libraries
- Children's museums
- Recreation departments
- Town/community calendars
- Nature/science centers
- Chambers of commerce
- Farms and orchards
- Indoor play spaces
- Family-oriented businesses

The architecture should allow each source to have its own ingestion adapter.

All imported data should be normalized into the common Event model.

Do NOT build the complete automated ingestion system for the first MVP. Seed the database with sample/manual events first and design the architecture so automated ingestion can be added later.

---

## Future Event Ingestion

Eventually Local Eye should support scheduled ingestion jobs.

Conceptually:

Source website/feed
→ Source adapter
→ Extract event information
→ Normalize data
→ Detect duplicates
→ Categorize event
→ Save/update event
→ Record source + verification timestamp

AI may eventually help extract structured event information from unstructured webpages.

Do not rely on AI when deterministic parsing is available.

---

## Community Event Submission

A future feature should allow parents, businesses, or event organizers to submit missing events.

Potential workflow:

**Know about an event?**

Paste an event URL.

Local Eye extracts available information and presents a form for confirmation.

The event should enter a moderation/verification state before automatically becoming publicly visible.

---

## Recommendation / Ranking

Local Eye should eventually rank results rather than simply sort chronologically.

Potential ranking factors:

- Child's age matches event
- Distance
- Date/time match
- Budget
- Indoor/outdoor preference
- Weather
- Registration availability
- User preferences
- Event freshness
- Event quality/relevance

For the MVP, keep ranking deterministic and simple.

Do not introduce an unnecessary AI recommendation system.

---

## Activities Beyond Events

Long term, Local Eye should become an **outing discovery engine**, not merely an events calendar.

When there are few scheduled events, it could recommend evergreen activities such as:

- Playgrounds
- Beaches
- Hiking trails
- Children's museums
- Farms
- Indoor play spaces
- Nature centers
- Libraries
- Zoos
- Seasonal attractions

This allows Local Eye to answer:

**"What should we do today?"**

even when no special event is happening.

---

## Weather Integration — Future

Weather could eventually influence recommendations.

Examples:

Rain:
- Museums
- Libraries
- Indoor play
- Open gyms

Nice weather:
- Playgrounds
- Farms
- Nature programs
- Beaches
- Festivals

Weather integration is NOT necessary for the initial MVP.

---

## Geographic Scope

Launch locally before expanding.

Initial market:

**Southern Maine**
- South Berwick
- Eliot
- Kittery
- York

**New Hampshire**
- Portsmouth
- Dover
- Durham
- Newmarket
- Exeter
- Stratham
- Greenland
- Rye
- Hampton

The architecture should not hard-code these towns so Local Eye can eventually expand to other geographic markets.

---

## Business Model

Local Eye should initially be **free for parents**.

Potential future monetization comes from local businesses and organizations.

Possible offerings:

- Free event listings
- Paid promoted events
- Enhanced venue/business profiles
- Monthly local partner subscriptions
- Featured placement
- Deals/offers
- Event analytics

Paid placement must always be clearly labeled as sponsored and should not compromise the relevance of organic recommendations.

---

## Suggested Technology

Use:

- **Next.js**
- **TypeScript**
- **React**
- **Tailwind CSS**
- **Supabase**
- **PostgreSQL**

The application should be mobile-first and responsive.

Build it initially as a web application rather than a native React Native application.

Keep the architecture simple enough for a small team to maintain.

---

## MVP Scope

Build only what is necessary to validate the concept.

### Include

1. Mobile-first home page
2. Event database
3. Seed/sample Seacoast event data
4. Search/filter interface
5. Age filtering
6. Date filtering
7. Time-of-day filtering
8. Price filtering
9. Indoor/outdoor filtering
10. Distance/location filtering
11. Event cards
12. Event details
13. Original source links
14. Save/favorite functionality if straightforward
15. Basic analytics

### Do NOT build yet

- Native iOS/Android apps
- Social network
- Parent reviews
- Messaging
- Business accounts
- Payments
- Advertising system
- AI chatbot
- Complex recommendation AI
- Nationwide event coverage
- Complete automated scraping system

Avoid premature complexity.

---

## MVP Success Metric

The primary validation question is:

**Do parents come back to Local Eye the next time they need something to do?**

Important metrics:

- Unique users
- Searches
- Event result clicks
- Source/registration clicks
- Saved activities
- Returning users
- Searches per returning user

Repeat usage is more important than account registrations during initial validation.

---

## Product Principle

Local Eye should NOT become another overwhelming event calendar.

The product should reduce decision-making.

Instead of:

**"Here are 147 events this weekend."**

Local Eye should feel like:

**"Here are 6 good things you could do with your 2-year-old Saturday morning within 20 minutes of home."**

Optimize the application around that principle when making product and engineering decisions.
