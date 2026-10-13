# **AMI: Building Infrastructure for Physical Commodity Markets**

*Why I'm connecting brokerage software, commodity price indices, market intelligence and digital trading infrastructure into one ecosystem, starting with Ukrainian agriculture.*

For a while now, most of my business attention has been concentrated on a rather specific industry: agricultural commodities.

Grain trading, brokerage, market data, logistics, contract execution and the software that connects all these activities.

I am originally from Ukraine, although I currently live in France. And Ukraine is a particularly interesting place to work on agricultural market infrastructure.

It is one of the world's major agricultural producers and exporters. Grain and oilseeds are essential to its economy, international trade and relationships with global markets.

But physical commodity trading is an extraordinarily fragmented business.

There are brokers, traders, producers, exporters, logistics companies, ports, freight brokers, banks and numerous other participants.

All of them need information.

All of them exchange documents.

All of them make decisions based on prices, delivery conditions, counterparties and constantly changing logistics.

And surprisingly much of that work still happens through spreadsheets, phone calls, messaging applications and disconnected software.

I've spent a substantial part of my professional life building business systems. Eventually, I became interested in what would happen if we approached this market not as a collection of separate software problems, but as one connected infrastructure problem.

That is how **AMI, Agro Market Infrastructure**, began to take shape.

## **The problem isn't a lack of software**

Agricultural trading companies already use software.

They have accounting systems.

Some have ERPs.

Some use CRMs.

They subscribe to market data services.

They communicate through Telegram, WhatsApp and email.

They maintain spreadsheets for prices, offers, contracts and logistics.

And frequently, every department has developed its own system for keeping track of what is happening.

The problem is that these systems rarely form one coherent operating environment.

A broker receives an offer.

Another broker knows a potential buyer.

A trader negotiates the price.

Somebody checks market information.

Someone else handles the contract.

An execution officer starts working on delivery.

Then the logistics team gets involved.

Documents travel between departments, often passing through several formats along the way.

Every transition creates another opportunity to lose context, duplicate work or introduce an error.

I don't think the answer is necessarily to build one enormous application that tries to replace everything.

I am much more interested in creating **connected infrastructure where specialised tools can exchange information and support the same commercial process.**

That distinction became central to AMI.

## **MN7R: The operational layer**

One of the core products is [MN7R](https://mn7r.com/?utm_source=chatgpt.com), an AI-assisted operating system for agricultural commodity brokers.

MN7R grew around the actual work of brokerage teams.

Bids.

Offers.

Matching buyers and sellers.

Trades.

Contracts.

Execution.

Client relationships.

Reporting.

The basic workflow is straightforward:

**BID → OFFER → MATCH → TRADE → EXECUTION → REPORT**

Of course, each of those steps becomes considerably more complicated in real life.

A broker may be working with multiple clients, commodities, delivery periods and locations simultaneously.

Offers change.

Prices change.

Counterparties change their requirements.

Logistical conditions can make an otherwise attractive transaction impossible.

And after an agreement is reached, the transaction still needs to be executed.

MN7R is intended to keep these activities connected within a role-based workspace.

But I'm also interested in what happens when the software becomes capable of assisting with the work itself.

Not simply recording what employees have already done.

AI-assisted execution workflows, controlled drafts, document handling and market context are part of that development.

The important word here is *controlled*.

I don't believe commodity trading should become a situation where an unsupervised AI agent decides to commit somebody to a contract or move money because it thought the opportunity looked attractive.

The objective is to support professionals, reduce repetitive work and make their decisions better informed.

Spike Brokers is the first production partner using MN7R in real brokerage operations.

That matters because the system is being developed around actual commercial workflows, not simply an abstract vision of how commodity brokers might work.

## **1D3X: Understanding what the market is doing**

The second major part of AMI is [1D3X](https://1d3x.com/?utm_source=chatgpt.com).

If MN7R is concerned with brokerage operations, 1D3X is concerned with the market information on which those operations depend.

Physical commodity markets have a peculiar problem.

There is rarely one universal price for a commodity.

A tonne of wheat isn't simply worth a certain number of dollars.

Its price depends on quality, location, delivery terms, timing, logistics, market conditions and numerous other factors.

The same commodity can have significantly different commercial values depending on where and how it is delivered.

International exchanges provide important reference prices, but they do not necessarily reflect the commercial reality of every local physical market.

This is why local commodity indices matter.

Working with industry partners, we developed index infrastructure for Ukrainian agricultural markets, including projects associated with the **Ukrainian Grain Association** and **Spike Brokers**.

These include [UGA Index](https://uga.1d3x.com/) and [SPIKE SPOT INDEX](https://spike.1d3x.com/?utm_source=chatgpt.com).

The purpose isn't simply to display another price chart.

It is to create a repeatable process for collecting market assessments, applying a transparent methodology, calculating benchmarks and publishing information that market participants can actually use.

And once you have that infrastructure, you can begin applying the same approach to other markets.

Different countries.

Different commodities.

Different trading conditions.

Different local partners.

The underlying technology can remain reusable while the methodology and market relationships reflect local realities.

That is the larger idea behind 1D3X.

Not one index.

**Infrastructure for building and operating many locally relevant commodity indices.**

## **Market intelligence is more than a price**

A published price doesn't explain everything.

Suppose a local grain index changes.

Why did it move?

Was it a change in demand?

Logistics?

Port capacity?

Weather?

Export activity?

A regulatory development?

Or simply a temporary shift in market liquidity?

Market participants need context.

That's why we are also developing monitoring, analytical reporting and evidence-backed AI capabilities around the indices.

The 1D3X Context and Cortex systems are intended to connect market observations, published data, news, relevant sources and operational knowledge.

The purpose is not to have AI invent market conclusions from whatever happens to be circulating online.

It's to give the system controlled access to relevant evidence and use that information to help analysts and market participants understand what may be happening.

An important principle is that **AI-generated market commentary is not the same thing as an official benchmark calculation**.

Published index values are methodology-driven.

AI can help interpret them, explain market context and prepare analytical material.

It should not arbitrarily determine the official price.

I think that separation is essential if we want these systems to become credible professional infrastructure rather than another collection of AI-generated dashboards.

## **From market information to actual execution**

Once you begin connecting brokerage operations with market information, other possibilities appear.

A broker can see a market signal.

A trader can compare it with current commercial offers.

An execution team can follow the resulting transaction.

Logistics information can help determine whether the proposed deal is realistic.

And the entire process can preserve a more coherent record of what happened.

Freight brokerage and logistics are particularly important here.

A grain transaction may look profitable on paper, but the availability and cost of transportation can change the calculation completely.

Ports, rail connections, road transport, freight availability and delivery conditions are not secondary details.

They are part of the commodity market itself.

This is especially visible in Ukraine, where the war has repeatedly disrupted established export routes and forced market participants to adapt their logistics.

So AMI is not intended to stop at brokerage software and price indices.

The broader direction includes execution workflows, logistics intelligence, freight-related processes and the connections between them.

Some components are already operating.

Others are under development.

And some remain longer-term opportunities requiring additional partners and infrastructure.

I prefer to be explicit about those differences rather than present everything as a finished product.

## **Cropto: Exploring the next layer**

There is also a more experimental direction.

[Cropto](https://cr0pto.com/?utm_source=chatgpt.com) explores digital commodity contracts, document verification, indexed trading workflows and settlement traceability.

This is where blockchain becomes relevant.

Not because I think every agricultural transaction needs a cryptocurrency.

And certainly not because putting grain on a blockchain automatically makes the grain market more efficient.

The interesting applications are much more practical.

Can a contract have a verifiable digital record?

Can changes in document status be tracked?

Can different participants verify the state of a transaction?

Can indexed commodity obligations and settlement processes become easier to audit?

These are infrastructure questions.

Cropto has functional prototypes and experiments around these ideas, including document tokenisation and settlement mechanisms.

Its standalone development is currently paused while we concentrate on the more immediate parts of the AMI ecosystem.

It is not a live regulated trading venue.

But I consider the underlying research relevant to the longer-term direction of the project.

If market data, commercial workflows and execution records become more connected and verifiable, additional financial and risk-management services may eventually become possible.

That will require the right commercial, technical and regulatory partners.

It isn't something software alone can solve.

## **Why Ukraine, and why internationally?**

My connection to this industry is partly professional and partly personal.

I'm Ukrainian.

I now live in France because of the war.

And I continue to be interested in projects that can strengthen Ukrainian businesses and their ability to operate internationally.

Agricultural exports are particularly important in this context.

For Ukrainian producers, brokers, traders and exporters, better infrastructure can mean easier access to information, more efficient operations, better coordination and potentially stronger relationships with international counterparties.

But I don't see AMI as a Ukraine-only project.

Ukraine is a natural starting point because we have real market relationships, practical experience and operating partners there.

The underlying problems exist elsewhere.

Fragmented market data.

Local pricing differences.

Inefficient workflows.

Logistical complexity.

Limited access to transparent benchmarks.

Disconnected commercial systems.

These are not exclusively Ukrainian problems.

The ambition is to develop infrastructure that can be adapted to other agricultural and physical commodity markets through local partnerships.

We provide technology, operating systems and reusable methodologies.

Local partners bring market knowledge, commercial relationships and credibility.

I think that combination is more realistic than trying to build a global commodity platform that understands every local market from a remote office.

## **Why these projects belong together**

At first glance, MN7R, 1D3X, market-monitoring systems and Cropto may look like separate businesses.

One is an ERP-like brokerage workspace.

Another operates price indices.

Another produces market intelligence.

Another explores digital contracts and settlement mechanisms.

But they address different parts of the same underlying process.

A physical commodity transaction begins with information.

Someone needs to know what is available, where it is, what it costs and under which conditions it can be delivered.

Then comes commercial interaction.

Offers.

Negotiations.

Matching.

Agreements.

Contracts.

Execution.

Logistics.

Settlement.

And throughout that process, market information continues to change.

So the systems shouldn't necessarily be isolated.

A brokerage workspace can benefit from reliable market data.

An index platform can benefit from structured market observations.

Execution workflows can benefit from better context.

And the records generated by actual commercial activity can help identify where the infrastructure needs to improve.

The goal is not to merge every application into one enormous piece of software.

**It is to create an ecosystem in which the different layers reinforce one another.**

That is what AMI is intended to represent.

## **An infrastructure project, not another dashboard**

I've worked on many different types of software and business systems over the years.

Marketing platforms.

Commercial tools.

Publishing infrastructure.

ERP systems.

Analytics.

AI-assisted development.

And one recurring observation is that building an application is often the easy part.

The difficult part is understanding how people actually work.

Who provides the information?

Who needs to trust it?

Who makes the decision?

Who is responsible when something goes wrong?

Which processes can be automated?

Which require human judgement?

And what happens when two organisations need to cooperate but don't share the same systems?

Those questions are particularly important in physical commodity markets.

Because the market isn't simply a collection of prices displayed on screens.

It's a network of commercial relationships, operational responsibilities, physical assets and constantly changing conditions.

AMI is my attempt, together with our industry and technology partners, to build more coherent digital infrastructure around that reality.

Starting with Ukrainian agriculture.

Developing through real brokerage operations and market-index projects.

And gradually expanding toward a broader ecosystem of connected commodity-market tools.

Some parts are already in production.

Some are still being developed.

Others are experiments that may become useful when the right partners and conditions appear.

I don't expect the architecture to remain unchanged.

Markets evolve.

Technology evolves.

AI capabilities evolve.

And the infrastructure should evolve with them.

But the underlying objective remains straightforward.

**Make physical commodity markets easier to understand, easier to operate and better connected.**

That is what we're building with AMI.
