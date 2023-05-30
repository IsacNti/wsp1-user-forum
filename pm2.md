# Forum
Isac Lindholm | 2023-04-04

## Inledning 

Arbet var att skapa ett forum som använder sig av en data bas för att spara infromation som inlääg vem som lagt upp och nä. Skulle även finnas ett inlognings system som kopplar sig till data basen för att lagra användare. En fortsätnning på föra delen.

## Backgrund

Började hitta ett omrdåde jag ville utveckla detta var startsidan, listan och en profil. Jag utvecklad listan genom att göra de möjligt att gå in en annan användares profil så skappade en länk på användaren som var länkad till en publicprofile. För att kunna prata om publicprofile så måste man prata om profile. Profile ville jag skapa en möjlighet att lägga till saker göra så att en person kan göra en personlig profil. Med det skapade jag 3 nya tabels i tabel+ il05profile, il05userGame, il05Games. Där i il05profile finns id, uId, spotify, alder(ålder), plats, createdAt. I il05userGame finns uId, gId, id, createdAt. I il05games finns id, title. sedan gjorde jag de möjligt att komma åt de olika sakerna i table med koden:

if (req.session.LoggedIn) {
        const [users] = await promisePool.query("SELECT * FROM il05users WHERE name=?", req.session.userId);
        const [rows] = await promisePool.query(`
        SELECT il05profile.*, il05users.name AS username
        FROM il05profile
        JOIN il05users ON il05profile.uId = il05users.id
        WHERE il05profile.uId = ? ORDER BY createdAt DESC LIMIT 1`, req.session.uId);
        const [games] = await promisePool.query(`
        Select * FROM il05userGame
        JOIN il05games ON il05userGame.gId = il05games.id
        WHERE il05userGame.uId = ? ORDER BY createdAt desc`, req.session.uId);

Här gör jag att allt är anslutet till uId så att den väljer en specifik användares grejer. gId som finns i il05userGame joinas med il05games id för titeln är spelet och id kopplas till gId för att göra en lista med användarens uId för att göra de möjligt att skriva ut en specefik persons spel i dens profil. genom att använda:

{% set g3 = games.slice(0, 3) %}
{% for games in g3 %}
    <p>{{ games.title | safe}}</p>
{% endfor %}

så görs de att i huvud profilen läggs de 3 senaste spelen för slice (0, 3) väljer 1, 2, 3 i listan som skapas med const games. samt så gör 'ORDER BY createdAt desc' läggs de nyaste tillagda spelen först i listan. En lista av alla spel skapas i botten av profil.

För att göra de möjligt att lägga till saker till sin profil måste man ha en post jag gjorde 2 stycken pop upp som kommer till då du klickar på en knapp(de har varsin knapp) gör de möjligt att fylla i fält och skicka in det du vill lägga till ett spel eller skapa din profil. Där jag saniterade inkomande ord men inte på en plats för den tilåter bara siffror.

Publicprofile är nästan lika dan som profile skillnaden är att publicprofile går det inte att lägga till saker, ta bort kontot eller några andra knappar samt att den använder en persons uId för att vissa upp hur dens profil ser ut.

Startsidan gjorde jag så de finns en liten beskrivning om profilen och det går att dela saker på sidan sedan om du inte är inloggad så finns de 2 knappar att logga in och att registrera.


## Posetiva erfarenheter

Att skapa tabels samt göra posts att göra pop upp för att lägga till saker i sin profil gick bra.
Göra html kode.

## Negativa erfarenheter

Svårt med vissa sql frågor då jag inte hade bemästrat de helt. 
Svårt med slice för visste inte om det. 
problem me att personliga grejer inte fungerade

## Sammanfatning 

Fått utöckad kunskap runt sql frågor samt hur man ska göra med datan för att få fram de på bästa sätt i ett html dokument. Fått lära mig hur slice fungerar. Fått fram en sida som fungerar där du kan göra en profil lägga in en länk lägga till spel samt om du har en profil kan du göra inlägg där din användare går att gå in på.