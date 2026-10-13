# **AMI : construire une infrastructure numérique pour les marchés agricoles**

*Pourquoi je développe un écosystème reliant le courtage agricole, les indices de prix, l'intelligence de marché et les outils numériques de négociation, en commençant par l'Ukraine.*

Depuis quelque temps, une grande partie de mon activité professionnelle se concentre sur un secteur assez particulier : le commerce des matières premières agricoles.

Les céréales, le courtage, les marchés physiques, les prix, la logistique, l'exécution des contrats et les systèmes informatiques qui permettent à tous ces éléments de fonctionner ensemble.

Je suis originaire d'Ukraine, même si je vis aujourd'hui en France.

Et l'Ukraine occupe une place importante dans cette histoire.

C'est l'un des grands pays producteurs et exportateurs de céréales et d'oléagineux. L'agriculture représente une composante essentielle de son économie, mais aussi de ses relations commerciales avec le reste du monde.

Pourtant, derrière les millions de tonnes de blé, de maïs ou de tournesol qui circulent sur les marchés internationaux, on trouve un environnement opérationnel étonnamment fragmenté.

Des producteurs.

Des négociants.

Des courtiers.

Des exportateurs.

Des transporteurs.

Des ports.

Des affréteurs.

Des banques.

Des sociétés de logistique.

Et une quantité considérable d'informations qui doivent circuler entre eux.

Une bonne partie de ces échanges repose encore sur des fichiers Excel, des appels téléphoniques, des messageries et des logiciels qui communiquent difficilement entre eux.

Après avoir passé une grande partie de ma carrière à développer des systèmes pour différentes entreprises et industries, j'ai commencé à m'intéresser à cette question :

**Et si nous abordions le marché agricole non pas comme une collection de problèmes informatiques indépendants, mais comme un seul problème d'infrastructure ?**

C'est de cette réflexion qu'est né **AMI, Agro Market Infrastructure**.

## **Le problème n'est pas le manque de logiciels**

Les entreprises de négoce agricole utilisent déjà des logiciels.

Elles disposent de systèmes comptables, parfois d'ERP, de CRM, d'outils de suivi des marchés et de plateformes documentaires.

Elles achètent des données.

Elles échangent des offres par téléphone, Telegram, WhatsApp ou courrier électronique.

Elles maintiennent des tableaux de prix, des listes de clients et des documents contractuels.

Et bien souvent, chaque service développe progressivement sa propre manière de travailler.

Le courtier reçoit une offre.

Un autre courtier connaît un acheteur potentiel.

Le négociant vérifie les conditions commerciales.

Quelqu'un consulte les prix du marché.

Une autre personne prépare le contrat.

L'équipe chargée de l'exécution organise la livraison.

Puis interviennent les transporteurs, les documents, les paiements et les différentes vérifications.

À chaque transition, une partie du contexte risque de disparaître.

Une information doit être ressaisie.

Une version du document devient obsolète.

Une décision est prise sur la base de données qui ne sont plus entièrement à jour.

La réponse habituelle consiste à ajouter un logiciel supplémentaire.

Je ne suis pas convaincu que ce soit toujours la bonne approche.

Je préfère construire **une infrastructure cohérente dans laquelle plusieurs outils spécialisés peuvent échanger leurs informations et participer au même processus commercial**.

C'est précisément l'idée derrière AMI.

Pas nécessairement une gigantesque application destinée à tout remplacer.

Plutôt un écosystème de systèmes complémentaires.

## **MN7R : l'environnement opérationnel des courtiers**

L'un des éléments centraux de cet écosystème est [MN7R](https://mn7r.com/).

MN7R est un environnement de travail destiné aux courtiers en matières premières agricoles, avec des fonctionnalités d'assistance par intelligence artificielle.

Le projet s'est développé autour des opérations réelles des équipes de courtage.

Les offres d'achat.

Les offres de vente.

La recherche de contreparties.

La mise en relation des acheteurs et des vendeurs.

Les transactions.

Les contrats.

L'exécution.

Le suivi des clients.

Les rapports et l'analyse de l'activité.

Le processus commercial peut être résumé ainsi :

**BID → OFFER → MATCH → TRADE → EXECUTION → REPORT**

Sur le papier, cela semble relativement simple.

Dans la réalité, chaque étape comporte une multitude de variables.

Un courtier travaille simultanément avec différents clients, plusieurs produits agricoles, des périodes de livraison distinctes et des conditions logistiques changeantes.

Une offre peut être modifiée.

Un prix peut évoluer.

Un acheteur peut changer ses exigences.

Une transaction intéressante peut devenir irréalisable parce que le transport coûte trop cher ou qu'aucune solution logistique n'est disponible.

Et même lorsqu'un accord commercial est conclu, le travail est loin d'être terminé.

Il reste le contrat, son exécution, les documents, la livraison et les paiements.

MN7R cherche à réunir ces opérations dans un environnement cohérent, organisé selon les rôles et les responsabilités des utilisateurs.

Mais je m'intéresse aussi à ce qui se passe lorsque le logiciel commence à participer activement au travail.

Pas simplement enregistrer les actions déjà effectuées par les employés.

Aider à préparer des documents.

Analyser des informations.

Organiser des opérations.

Suivre les étapes d'exécution.

Fournir du contexte aux décisions commerciales.

C'est là que l'intelligence artificielle devient intéressante.

À condition, évidemment, qu'elle reste sous contrôle.

Je ne pense pas qu'un agent IA devrait pouvoir engager une entreprise dans un contrat commercial ou décider seul d'une opération financière simplement parce qu'il a identifié une opportunité.

L'objectif est d'assister les professionnels, de réduire le travail répétitif et d'améliorer la qualité des décisions.

**Spike Brokers est le premier partenaire opérationnel utilisant MN7R dans ses activités réelles de courtage.**

C'est un élément important du projet : le système se développe au contact des pratiques professionnelles existantes, et non à partir d'une vision purement théorique du commerce des matières premières.

## **1D3X : comprendre les prix des marchés physiques**

Le deuxième élément majeur de l'écosystème est [1D3X](https://1d3x.com/).

Si MN7R concerne les opérations commerciales, 1D3X concerne les informations de marché sur lesquelles reposent ces opérations.

Les marchés physiques des matières premières présentent une particularité intéressante.

Il n'existe pas nécessairement un prix unique pour un produit donné.

Une tonne de blé n'a pas simplement une valeur universelle exprimée en dollars.

Son prix dépend de sa qualité.

De sa localisation.

Des conditions de livraison.

De la période.

Des coûts logistiques.

De la disponibilité du produit.

De la liquidité du marché.

Et de nombreuses autres circonstances.

Deux lots de céréales apparemment identiques peuvent donc avoir des valeurs commerciales très différentes.

Les grandes places boursières internationales fournissent des références importantes.

Mais elles ne décrivent pas toujours suffisamment les conditions réelles d'un marché physique local.

D'où l'intérêt des indices de prix régionaux.

Avec nos partenaires professionnels, nous avons développé des infrastructures d'indices pour les marchés agricoles ukrainiens, notamment dans le cadre de projets associés à l'**Ukrainian Grain Association** et à **Spike Brokers**.

Parmi ces projets figurent [UGA Index](https://uga.1d3x.com/) et [SPIKE SPOT INDEX](https://spike.1d3x.com/).

L'objectif n'est pas simplement d'afficher un graphique supplémentaire sur un site internet.

Il s'agit de construire un processus reproductible permettant de collecter des informations de marché, d'appliquer une méthodologie définie, de calculer des références de prix et de publier des données utilisables par les professionnels.

Une fois cette infrastructure développée, le même principe peut être adapté à d'autres marchés.

D'autres régions.

D'autres pays.

D'autres matières premières.

D'autres partenaires locaux.

La technologie peut rester réutilisable, tandis que les méthodologies et les données reflètent les particularités de chaque marché.

C'est l'ambition de 1D3X.

Non pas produire un seul indice.

**Construire une infrastructure permettant de développer et d'exploiter plusieurs indices adaptés aux marchés physiques locaux.**

## **Un prix ne suffit pas à comprendre un marché**

Supposons qu'un indice du blé ukrainien évolue fortement.

Que s'est-il passé ?

La demande a-t-elle augmenté ?

Les coûts de transport ont-ils changé ?

Un port rencontre-t-il des difficultés ?

La météo a-t-elle affecté les perspectives de récolte ?

Une nouvelle réglementation influence-t-elle les exportations ?

Ou s'agit-il simplement d'une variation temporaire de liquidité ?

Un chiffre ne répond pas à ces questions.

C'est pourquoi nous développons également des outils de monitoring, d'analyse et d'intelligence de marché autour des indices.

Les systèmes **1D3X Context** et **Cortex** visent à relier les observations commerciales, les données publiées, les actualités, les sources pertinentes et les connaissances opérationnelles.

L'intelligence artificielle peut jouer un rôle important dans ce processus.

Mais il faut distinguer deux choses.

**Le calcul officiel d'un indice doit reposer sur sa méthodologie.**

L'IA peut aider à interpréter les résultats, rechercher des informations pertinentes, préparer des analyses et expliquer les évolutions possibles du marché.

Elle ne doit pas inventer arbitrairement une valeur d'indice.

Cette séparation me paraît fondamentale.

Si l'on souhaite développer une infrastructure crédible, il faut distinguer clairement les données, les méthodes de calcul et les interprétations.

Autrement, on risque simplement de produire des tableaux de bord séduisants, mais difficiles à utiliser pour prendre des décisions professionnelles.

## **Du prix à la transaction, puis à son exécution**

Lorsque les outils de courtage et les données de marché commencent à fonctionner ensemble, de nouvelles possibilités apparaissent.

Un courtier peut observer un signal de marché.

Un négociant peut le comparer aux offres commerciales disponibles.

Une équipe peut préparer une transaction.

Les personnes chargées de l'exécution peuvent suivre les étapes contractuelles.

Et les informations logistiques peuvent aider à vérifier si l'opération est réellement faisable.

La logistique est particulièrement importante dans ce domaine.

Une transaction peut sembler excellente sur le papier.

Mais si le transport n'est pas disponible, si le fret augmente brutalement ou si les délais de livraison deviennent incompatibles avec le contrat, cette transaction peut perdre tout son intérêt.

Les ports.

Le transport ferroviaire.

Le transport routier.

L'affrètement maritime.

Les capacités disponibles.

Les conditions de livraison.

Tous ces éléments font partie du marché lui-même.

L'Ukraine illustre particulièrement bien cette réalité.

Depuis le début de l'invasion russe à grande échelle, les itinéraires d'exportation traditionnels ont été profondément perturbés.

Les entreprises ont dû trouver de nouvelles solutions, adapter leurs opérations et réorganiser leurs chaînes logistiques.

Pour moi, cela confirme que les données de marché ne peuvent pas être complètement séparées des informations opérationnelles.

C'est pourquoi AMI ne se limite pas au courtage et aux indices de prix.

L'écosystème s'intéresse également aux processus d'exécution, à la logistique, au courtage de fret et aux informations nécessaires pour relier ces activités.

Certaines fonctionnalités existent déjà.

D'autres sont en développement.

Et certaines restent des perspectives à plus long terme, dépendantes de nouveaux partenariats et de conditions techniques ou commerciales encore à réunir.

Je préfère faire cette distinction plutôt que de présenter l'ensemble comme un produit déjà entièrement achevé.

## **Cropto : explorer une autre couche de l'infrastructure**

Il existe également une direction plus expérimentale : [Cropto](https://cr0pto.com/).

Ce projet explore les contrats numériques portant sur les matières premières, la vérification documentaire, les opérations liées aux indices et la traçabilité des règlements.

C'est ici que les technologies blockchain peuvent devenir pertinentes.

Pas parce que je pense que toutes les transactions agricoles devraient utiliser des cryptomonnaies.

Ni parce qu'inscrire un contrat sur une blockchain suffit à rendre un marché plus efficace.

Les questions qui m'intéressent sont beaucoup plus concrètes.

Peut-on créer un historique numérique vérifiable d'un contrat ?

Peut-on suivre les changements de statut des documents ?

Différents participants peuvent-ils consulter et vérifier l'état d'une transaction ?

Peut-on rendre certaines étapes de règlement plus faciles à auditer ?

Cropto a donné lieu à plusieurs prototypes fonctionnels et expérimentations, notamment autour de la tokenisation documentaire et des mécanismes de règlement.

Le développement autonome du projet est actuellement mis en pause, pendant que nous concentrons nos efforts sur les composantes plus immédiates d'AMI.

Cropto n'est pas une plateforme de négociation réglementée en activité.

Mais les recherches réalisées restent pertinentes pour une évolution future de l'écosystème.

Si les informations de marché, les opérations commerciales et les documents contractuels deviennent plus interconnectés et vérifiables, d'autres services financiers ou outils de gestion des risques pourraient devenir envisageables.

Cela nécessitera évidemment des partenaires commerciaux, techniques et réglementaires appropriés.

Le logiciel, à lui seul, ne peut pas résoudre toutes ces questions.

## **Pourquoi commencer par l'Ukraine ?**

Pour moi, ce projet possède deux dimensions.

La première est professionnelle.

Je travaille depuis longtemps sur la conception de systèmes, l'automatisation, les processus commerciaux et les infrastructures numériques.

Les marchés agricoles constituent un environnement particulièrement intéressant pour appliquer ces compétences.

La seconde est personnelle.

Je suis Ukrainien.

Je vis aujourd'hui en France en raison de la guerre, mais je continue à travailler avec des partenaires et des entreprises ukrainiennes.

Et je considère que le développement d'une infrastructure commerciale plus efficace peut contribuer à renforcer leurs possibilités sur les marchés internationaux.

L'agriculture joue un rôle majeur dans cette perspective.

Pour les producteurs, courtiers, négociants et exportateurs ukrainiens, de meilleurs outils peuvent faciliter l'accès à l'information, améliorer la coordination, réduire certains coûts opérationnels et renforcer les relations avec les contreparties internationales.

Cela ne signifie pas pour autant qu'AMI doit rester un projet exclusivement ukrainien.

Les problèmes auxquels nous nous intéressons existent ailleurs.

La fragmentation des données.

Les différences de prix entre marchés locaux.

La complexité logistique.

Les processus commerciaux peu intégrés.

Le manque de références de prix transparentes.

Les difficultés de coordination entre entreprises.

Ces problèmes ne connaissent pas de frontières.

L'Ukraine constitue un point de départ naturel parce que nous y disposons de relations professionnelles, d'une expérience pratique et de partenaires opérationnels.

Mais l'infrastructure peut évoluer vers d'autres marchés physiques de matières premières.

## **Une infrastructure internationale construite avec des partenaires locaux**

Je ne crois pas beaucoup à l'idée qu'une entreprise technologique puisse comprendre parfaitement tous les marchés agricoles du monde depuis un seul bureau.

Chaque marché possède ses propres particularités.

Ses acteurs.

Ses habitudes commerciales.

Ses infrastructures logistiques.

Ses mécanismes de formation des prix.

Ses règles.

Ses risques.

Et ses relations professionnelles, qui ne peuvent pas simplement être remplacées par un algorithme.

C'est pourquoi je vois le développement international d'AMI comme un modèle fondé sur les partenariats.

Nous pouvons apporter la technologie.

Les outils.

Les systèmes opérationnels.

Les méthodologies réutilisables.

L'automatisation.

Les partenaires locaux apportent leur connaissance du marché, leurs relations commerciales, leur expertise sectorielle et leur crédibilité.

Ce modèle me paraît plus réaliste qu'une tentative de construire une plateforme mondiale unique qui prétendrait comprendre toutes les réalités locales.

Et il peut être particulièrement intéressant pour les entreprises européennes qui travaillent déjà avec des partenaires agricoles ukrainiens ou qui souhaitent développer des activités sur d'autres marchés physiques.

## **Pourquoi réunir tous ces projets ?**

À première vue, MN7R, 1D3X, les systèmes de monitoring et Cropto ressemblent à des projets indépendants.

L'un est un environnement opérationnel pour les courtiers.

Un autre produit des indices de prix.

D'autres outils analysent les informations de marché.

Cropto explore les contrats numériques et les mécanismes de vérification.

Pourquoi les réunir ?

Parce qu'ils interviennent à différentes étapes du même processus économique.

Une transaction sur un marché physique commence avec de l'information.

Quel produit est disponible ?

À quel endroit ?

À quel prix ?

Selon quelles conditions de livraison ?

Qui peut l'acheter ?

Qui peut le vendre ?

Puis viennent les interactions commerciales.

Les offres.

Les négociations.

La mise en relation.

Le contrat.

L'exécution.

La logistique.

Le règlement.

Et pendant tout ce temps, les conditions du marché continuent d'évoluer.

Les systèmes utilisés à ces différentes étapes devraient pouvoir communiquer entre eux.

Un logiciel de courtage peut bénéficier de données de marché fiables.

Une plateforme d'indices peut utiliser des observations structurées du marché.

Les équipes chargées de l'exécution peuvent travailler avec un meilleur contexte commercial et logistique.

Et l'activité opérationnelle peut contribuer à identifier de nouveaux besoins et de nouvelles possibilités d'amélioration.

L'objectif n'est pas de fusionner toutes les applications dans un logiciel gigantesque.

**L'objectif est de construire un environnement dans lequel plusieurs systèmes spécialisés deviennent plus utiles parce qu'ils fonctionnent ensemble.**

C'est ce que représente AMI.

## **Une infrastructure, pas simplement un tableau de bord**

Au cours de ma carrière, j'ai travaillé sur des systèmes très différents.

Des plateformes marketing.

Des logiciels commerciaux.

Des outils d'analyse.

Des ERP.

Des systèmes de publication.

Des applications utilisant l'intelligence artificielle.

Et j'ai régulièrement constaté la même chose.

Créer une application n'est souvent pas la partie la plus difficile.

Le véritable défi consiste à comprendre comment les personnes et les organisations travaillent.

Qui fournit l'information ?

Qui doit pouvoir lui faire confiance ?

Qui prend la décision ?

Qui est responsable lorsque quelque chose se passe mal ?

Quels processus peuvent être automatisés ?

Lesquels nécessitent une intervention humaine ?

Et comment faire coopérer plusieurs entreprises qui n'utilisent pas les mêmes systèmes ?

Ces questions sont particulièrement importantes sur les marchés physiques des matières premières.

Car un marché agricole n'est pas simplement un ensemble de prix affichés sur des écrans.

C'est un réseau de relations commerciales, de responsabilités opérationnelles, d'actifs physiques et de conditions qui changent constamment.

AMI est ma tentative, avec nos partenaires technologiques et professionnels, de construire une infrastructure numérique plus cohérente autour de cette réalité.

En commençant par l'agriculture ukrainienne.

En nous appuyant sur les opérations réelles de courtage et sur les projets d'indices de marché.

Et en développant progressivement un écosystème d'outils connectés pour les marchés des matières premières.

Certains éléments sont déjà opérationnels.

D'autres sont en cours de développement.

D'autres encore restent des expérimentations qui pourront devenir pertinentes lorsque les bonnes conditions seront réunies.

Je ne m'attends pas à ce que l'architecture reste figée.

Les marchés évoluent.

Les technologies évoluent.

Les possibilités offertes par l'intelligence artificielle évoluent.

Et l'infrastructure doit pouvoir évoluer avec elles.

Mais l'objectif reste simple :

**Rendre les marchés physiques des matières premières plus transparents, leurs opérations plus efficaces et leurs participants mieux connectés.**

C'est ce que nous construisons avec AMI.
