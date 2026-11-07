'use strict';
/* Armwerk – Trainingsdaten: Übungen, Trainingseinheiten, 8-Wochen-Plan */

const LEVELS = [
  { n: 1, title: 'Eingewöhnung', weeks: 'Woche 1–2', sets: 1, reps: [8, 10],
    note: 'Sehr leichte Gewichte, 1 Satz pro Übung. Nach jedem Satz solltest du noch mindestens 4 Wiederholungen übrig haben. Ziel: Technik lernen und möglichst wenig Muskelkater.' },
  { n: 2, title: 'Technik festigen', weeks: 'Woche 3–4', sets: 1, reps: [10, 12],
    note: 'Weiterhin 1 Satz, etwas mehr Wiederholungen. Das Gewicht steigt nur, wenn die letzten Einheiten gut vertragen wurden und alles leicht war.' },
  { n: 3, title: 'Zweiter Satz', weeks: 'Woche 5–6', sets: 2, reps: [10, 12],
    note: 'Ein zweiter Satz kommt dazu, aber nur bei guter Verträglichkeit. Du solltest nach jedem Satz noch 2–3 Wiederholungen übrig haben.' },
  { n: 4, title: 'Aufbau', weeks: 'Woche 7–8', sets: 2, reps: [12, 15],
    note: 'Zwei Sätze mit höheren Wiederholungen. Schaffst du sauber 15 Wiederholungen, darfst du das Gewicht um die kleinste Stufe erhöhen und wieder bei 12 beginnen.' }
];

const WARMUP = [
  'Locker auf der Stelle gehen (ca. 45 Sekunden, ohne Hüpfen).',
  'Schultern 10× nach hinten kreisen.',
  'Arme seitlich ausgestreckt 10× kleine Kreise.',
  'Schulterblätter 10× zusammen- und wieder auseinanderziehen.',
  'Ellbogen 10× beugen und strecken, ganz ohne Gewicht.'
];

const EX = {
  curl: {
    id: 'curl', name: 'Bizeps-Curl sitzend',
    muscles: { main: ['Bizeps'], assist: ['Oberarmmuskel (Brachialis)', 'Unterarm'] },
    startWeight: 2, step: 0.5, rest: 75, video: 'Bizeps Curl sitzend Kurzhantel richtig ausführen',
    quick: ['Rücken angelehnt, Ellbogen am Körper', 'Hanteln in ca. 2 Sekunden zur Schulter beugen', 'In ca. 3 Sekunden kontrolliert absenken'],
    setup: 'Setze dich auf einen stabilen Stuhl mit Rückenlehne. Der Rücken liegt an der Lehne, beide Füße stehen flach auf dem Boden, die Knie sind etwa im rechten Winkel (bequem für dein Knie). Die Hanteln hängen seitlich neben dem Körper, die Handflächen zeigen nach vorn, die Ellbogen liegen locker an den Rippen.',
    steps: ['Ellbogen an den Rippen lassen und die Schultern locker nach unten halten.', 'Beide Hanteln in ca. 2 Sekunden Richtung Schultern beugen.', 'Oben 1 Sekunde kurz halten und den Bizeps bewusst anspannen.', 'In ca. 3 Sekunden kontrolliert wieder absenken, bis die Arme fast gestreckt sind.'],
    breathing: 'Ausatmen beim Anheben, Einatmen beim Absenken. Nicht die Luft anhalten.',
    execution: 'Nur die Unterarme bewegen sich, die Oberarme bleiben ruhig. Tempo ca. 2 – 1 – 3 Sekunden (hoch – halten – runter). Kein Schwung.',
    mistakes: ['Schwung aus dem Oberkörper oder Rücken holen', 'Ellbogen wandern nach vorn', 'Handgelenke knicken ab', 'Schultern werden hochgezogen', 'Gewicht ist so schwer, dass die Technik leidet'],
    safety: ['Rücken bleibt an der Lehne, kein Hohlkreuz.', 'Arme unten nicht „durchfallen“ lassen, sondern abbremsen.', 'Bei Schmerzen im Ellbogen oder Handgelenk sofort stoppen.'],
    weightGuide: 'Start mit 2 kg pro Hand (1 kg, falls 2 kg schon anstrengend wirkt). Mit den verstellbaren Hanteln später typischerweise 4–10 kg. Erhöhen nur in der kleinsten Stufe.'
  },
  tri: {
    id: 'tri', name: 'Trizeps-Überkopfstrecken sitzend',
    muscles: { main: ['Trizeps'], assist: ['Schulterstabilisatoren', 'Rumpf'] },
    startWeight: 2, step: 0.5, rest: 75, video: 'Trizeps Überkopf Strecken sitzend eine Kurzhantel',
    quick: ['Eine Hantel mit beiden Händen halten', 'Ellbogen nah am Kopf, Rücken an der Lehne', 'Hinter dem Kopf beugen, dann strecken'],
    setup: 'Setze dich aufrecht auf einen Stuhl mit Rückenlehne, der Rücken ist angelehnt. Halte eine Kurzhantel mit beiden Händen am Griff und führe sie mit gestreckten Armen über den Kopf. Die Rippen bleiben unten, der Bauch ist leicht angespannt.',
    steps: ['Ellbogen zeigen nach vorn-oben und bleiben nah am Kopf.', 'Hantel in ca. 3 Sekunden hinter den Kopf absenken, bis die Ellbogen etwa 90° gebeugt sind.', 'Ellbogen kräftig, aber ohne Ruck strecken.', 'Oben die Arme nicht „einrasten“ lassen, kurz halten und wiederholen.'],
    breathing: 'Einatmen beim Absenken, Ausatmen beim Strecken.',
    execution: 'Nur die Unterarme bewegen sich. Die Oberarme bleiben senkrecht und ruhig. Langsam absenken, kontrolliert strecken.',
    mistakes: ['Hohlkreuz beim Strecken', 'Ellbogen weichen weit nach außen aus', 'Hantel wird zu tief abgelassen oder fällt hinter den Kopf', 'Zu schweres Gewicht', 'Kopf wird nach vorn geschoben'],
    safety: ['Rücken immer an der Lehne – kein Hohlkreuz.', 'Hantel mit beiden Händen sicher halten, nicht über dem Gesicht arbeiten.', 'Wenn Überkopfpositionen in der Schulter unangenehm sind: Übung auslassen.'],
    weightGuide: 'Start mit einer 2-kg-Hantel. Später mit verstellbaren Hanteln typischerweise 4–10 kg in einer Hantel.'
  },
  lat: {
    id: 'lat', name: 'Seitheben sitzend',
    muscles: { main: ['Seitliche Schulter (Deltamuskel)'], assist: ['Obere Trapezmuskulatur', 'Rotatorenmanschette'] },
    startWeight: 1, step: 0.5, rest: 60, video: 'Seitheben sitzend Kurzhantel seitliche Schulter',
    quick: ['Aufrecht sitzen, Ellbogen leicht gebeugt', 'Arme seitlich bis Schulterhöhe heben', 'Langsam absenken, nicht schwingen'],
    setup: 'Setze dich aufrecht auf einen Stuhl, Rücken an der Lehne oder aufrecht ohne Hohlkreuz. Die Hanteln hängen seitlich neben dem Körper, die Ellbogen sind leicht gebeugt, die Schultern locker.',
    steps: ['Arme mit leicht gebeugten Ellbogen seitlich anheben, die Ellbogen führen.', 'Bis etwa auf Schulterhöhe heben, nicht höher.', 'Oben kurz halten.', 'In ca. 3 Sekunden langsam absenken.'],
    breathing: 'Ausatmen beim Heben, Einatmen beim Absenken.',
    execution: 'Tempo ca. 2 – 1 – 3 Sekunden. Die Hände bleiben etwa auf Höhe der Ellbogen oder darunter. Bewegung nur aus der Schulter.',
    mistakes: ['Schwung aus Oberkörper oder Beinen', 'Schultern zu den Ohren ziehen', 'Arme über Schulterhöhe heben', 'Hände höher als die Ellbogen', 'Zu schweres Gewicht'],
    safety: ['Hier reicht ein sehr leichtes Gewicht, die Schulter reagiert empfindlich.', 'Bei einem stechenden Schmerz oben in der Schulter sofort stoppen.', 'Nicht gegen Schmerz „durchziehen“.'],
    weightGuide: 'Start mit 1 kg pro Hand. Später typischerweise 2–5 kg. Steigere hier besonders vorsichtig.'
  },
  row: {
    id: 'row', name: 'Einarmiges Rudern abgestützt',
    muscles: { main: ['Breiter Rückenmuskel', 'Rautenmuskel (Schulterblatt)'], assist: ['Bizeps', 'hintere Schulter'] },
    startWeight: 2, step: 0.5, rest: 75, video: 'Einarmiges Kurzhantelrudern abgestützt am Tisch stehend',
    quick: ['Hand auf Tisch oder Stuhllehne stützen', 'Rücken gerade, Schulterblatt nach hinten ziehen', 'Ellbogen Richtung Hüfte, dann langsam ab'],
    setup: 'Stelle dich neben einen stabilen Tisch oder eine hohe Stuhllehne (etwa hüfthoch). Stütze eine Hand auf, beuge dich aus der Hüfte leicht vor (ca. 30–45°) und halte den Rücken gerade. Die Knie sind leicht gebeugt, die Füße etwa hüftbreit. Die andere Hand hält die Hantel, der Arm hängt nach unten.',
    steps: ['Zuerst das Schulterblatt Richtung Wirbelsäule ziehen.', 'Dann den Ellbogen eng am Körper Richtung Hüfte nach hinten-oben führen.', 'Oben 1 Sekunde halten.', 'In ca. 3 Sekunden kontrolliert absenken, danach Seite wechseln.'],
    breathing: 'Ausatmen beim Heranziehen, Einatmen beim Absenken.',
    execution: 'Der Oberkörper bleibt ruhig und dreht sich nicht mit. Ziehe mit dem Rücken, nicht nur mit dem Arm. Beide Seiten gleich oft trainieren.',
    mistakes: ['Oberkörper dreht sich mit', 'Rücken rundet sich', 'Schulter wird zum Ohr gezogen', 'Hantel wird mit Schwung hochgerissen', 'Tisch ist so niedrig, dass der Rücken stark belastet wird'],
    safety: ['Stütze dich so hoch ab, dass der untere Rücken entspannt bleibt (Tisch lieber höher als niedriger).', 'Bauch leicht anspannen, Rücken gerade halten.', 'Zieht oder schmerzt der untere Rücken: Übung auslassen.'],
    weightGuide: 'Start mit 2 kg. Später mit verstellbaren Hanteln typischerweise 6–14 kg pro Hand.'
  },
  ham: {
    id: 'ham', name: 'Hammer-Curl sitzend',
    muscles: { main: ['Oberarmmuskel (Brachialis)', 'Bizeps'], assist: ['Unterarm (Brachioradialis)'] },
    startWeight: 2, step: 0.5, rest: 75, video: 'Hammer Curls sitzend Kurzhantel richtig',
    quick: ['Daumen zeigen nach oben', 'Ellbogen am Körper, Rücken angelehnt', 'Langsam beugen und absenken'],
    setup: 'Setze dich aufrecht auf einen Stuhl mit Rückenlehne. Die Hanteln hängen seitlich, die Handflächen zeigen zum Körper (Daumen nach vorn). Die Ellbogen sind am Körper.',
    steps: ['Ellbogen an den Rippen lassen.', 'Hanteln mit nach oben zeigenden Daumen in ca. 2 Sekunden Richtung Schulter beugen.', 'Oben kurz halten.', 'In ca. 3 Sekunden kontrolliert absenken.'],
    breathing: 'Ausatmen beim Anheben, Einatmen beim Absenken.',
    execution: 'Handgelenke bleiben gerade und fest. Du kannst beide Arme gleichzeitig oder abwechselnd arbeiten lassen. Tempo ca. 2 – 1 – 3 Sekunden.',
    mistakes: ['Schwung aus dem Rücken', 'Ellbogen wandern nach vorn', 'Handgelenke knicken ein', 'Hantel wird fallen gelassen statt gebremst'],
    safety: ['Rücken bleibt angelehnt.', 'Gewicht so wählen, dass die Handgelenke stabil bleiben.', 'Bei Schmerzen in Ellbogen oder Handgelenk stoppen.'],
    weightGuide: 'Start mit 2 kg pro Hand. Später typischerweise 4–10 kg.'
  },
  push: {
    id: 'push', name: 'Schräg-Liegestütz (Hände erhöht)', bw: true,
    muscles: { main: ['Brust (großer Brustmuskel)', 'Trizeps'], assist: ['Vordere Schulter', 'Rumpf'] },
    startWeight: 0, step: 0, rest: 75, video: 'Schräge Liegestütze Hände erhöht Tisch Anfänger',
    quick: ['Hände auf Tischkante oder Wand', 'Körper bildet eine gerade Linie', 'Brust kontrolliert zur Kante, dann hochdrücken'],
    setup: 'Stelle dich vor einen stabilen, rutschfesten Tisch (oder eine Wand). Lege die Hände etwa schulterbreit auf die Kante, die Arme sind gestreckt. Gehe die Füße zurück, bis dein Körper eine gerade Linie von Kopf bis Ferse bildet. Bauch und Gesäß sind leicht angespannt. Zum Einstieg: Wand (sehr leicht). Später: Tisch, danach tiefere Fläche.',
    steps: ['Körperspannung aufbauen: Bauch und Gesäß leicht anspannen.', 'Ellbogen in einem Winkel von etwa 45° zum Körper beugen und die Brust in ca. 3 Sekunden zur Kante führen.', 'Kurz vor der Kante stoppen.', 'Kontrolliert zurück in die Ausgangsposition drücken, ohne die Ellbogen durchzudrücken.'],
    breathing: 'Einatmen beim Absenken, Ausatmen beim Hochdrücken.',
    execution: 'Der Körper bleibt wie ein Brett. Die Bewegung ist langsam, ohne Ruck. Wenn du 10–12 saubere Wiederholungen schaffst, wähle eine etwas tiefere Fläche.',
    mistakes: ['Hüfte hängt durch (Hohlkreuz)', 'Ellbogen zeigen im 90°-Winkel zur Seite', 'Kopf wird nach vorn gestreckt', 'Nur halbe Bewegung', 'Gesäß wird nach oben geschoben'],
    safety: ['Tisch muss absolut stabil stehen und darf nicht rutschen.', 'Kein Hohlkreuz: Bauch anspannen, im Zweifel Position höher wählen.', 'Du kniest nicht, das schont das Knie.', 'Bei Handgelenkschmerzen eine höhere Fläche nutzen oder die Übung auslassen.'],
    weightGuide: 'Kein Zusatzgewicht. Die Schwierigkeit steuerst du über die Höhe der Auflagefläche: Wand (leichtester Einstieg) → Tischkante → niedrigere Fläche wie Sofalehne.'
  },
  press: {
    id: 'press', name: 'Schulterdrücken sitzend',
    muscles: { main: ['Schulter (vorderer und seitlicher Deltamuskel)', 'Trizeps'], assist: ['Obere Brust', 'Rumpf'] },
    startWeight: 2, step: 0.5, rest: 75, video: 'Schulterdrücken sitzend Kurzhantel Technik Anfänger',
    quick: ['Rücken angelehnt, Rippen unten', 'Hanteln auf Schulterhöhe', 'Ohne Hohlkreuz nach oben drücken'],
    setup: 'Setze dich aufrecht auf einen Stuhl mit Rückenlehne. Der Rücken liegt an der Lehne. Halte die Hanteln auf Schulterhöhe, die Handflächen zeigen nach vorn oder leicht zueinander. Die Unterarme stehen senkrecht.',
    steps: ['Bauch leicht anspannen, Rippen nach unten halten.', 'Hanteln in einer gleichmäßigen Bewegung nach oben drücken.', 'Oben die Arme nicht ganz durchstrecken.', 'In ca. 3 Sekunden bis auf Schulterhöhe absenken.'],
    breathing: 'Ausatmen beim Drücken, Einatmen beim Absenken.',
    execution: 'Die Hanteln bewegen sich leicht vor dem Körper auf einer geraden Linie nach oben. Kein Schwung aus den Beinen.',
    mistakes: ['Hohlkreuz beim Drücken', 'Schwung aus den Beinen', 'Ellbogen zu weit nach hinten', 'Arme oben hart durchgestreckt', 'Zu schweres Gewicht'],
    safety: ['Rücken immer an der Lehne, kein Hohlkreuz.', 'Mit leichten Gewichten beginnen, Schultern sind empfindlich.', 'Bei Schmerzen in der Schulter sofort stoppen.'],
    weightGuide: 'Start mit 2 kg pro Hand (1 kg, falls zu schwer). Später typischerweise 4–10 kg pro Hand.'
  },
  rfly: {
    id: 'rfly', name: 'Reverse-Fly sitzend (hintere Schulter)',
    muscles: { main: ['Hintere Schulter', 'Rautenmuskel (oberer Rücken)'], assist: ['Mittlere Trapezmuskulatur'] },
    startWeight: 1, step: 0.5, rest: 60, video: 'Reverse Fly sitzend vorgebeugt Kurzhantel hintere Schulter',
    quick: ['Oberkörper leicht vorgeneigt, Rücken gerade', 'Arme seitlich nach hinten öffnen', 'Schulterblätter kurz zusammenziehen'],
    setup: 'Setze dich an die Stuhlkante. Neige den Oberkörper aus der Hüfte leicht nach vorn (ca. 30–45°), der Rücken bleibt gerade. Die Hanteln hängen unter den Schultern, die Ellbogen sind leicht gebeugt, die Handflächen zeigen zueinander. Der Bauch ist leicht angespannt.',
    steps: ['Schulterblätter leicht zusammenziehen.', 'Arme mit leicht gebeugten Ellbogen seitlich bis etwa auf Schulterlinie öffnen.', 'Oben 1 Sekunde halten.', 'In ca. 3 Sekunden kontrolliert absenken.'],
    breathing: 'Ausatmen beim Öffnen, Einatmen beim Absenken.',
    execution: 'Die Bewegung kommt aus dem oberen Rücken, nicht aus Schwung. Der Oberkörper bleibt in der gleichen Neigung.',
    mistakes: ['Rücken rundet sich', 'Schwung aus dem Oberkörper', 'Schultern werden hochgezogen', 'Arme gehen höher als die Schulterlinie', 'Zu schweres Gewicht'],
    safety: ['Neige dich nur so weit vor, wie dein unterer Rücken entspannt bleibt (lieber aufrechter).', 'Nur sehr leichte Gewichte nutzen.', 'Zieht der untere Rücken, Übung auslassen.'],
    weightGuide: 'Start mit 1 kg pro Hand. Später typischerweise 2–6 kg.'
  },
  wrist: {
    id: 'wrist', name: 'Handgelenk-Beugen sitzend (Unterarm)', cap: 1, reps: [12, 15],
    muscles: { main: ['Unterarmbeuger'], assist: ['Griffkraft'] },
    startWeight: 1, step: 0.5, rest: 60, video: 'Handgelenk Curls sitzend Unterarm Kurzhantel',
    quick: ['Unterarm auf dem Oberschenkel ablegen', 'Nur das Handgelenk bewegt sich', 'Langsam, ohne Ruck'],
    setup: 'Setze dich aufrecht auf einen Stuhl. Lege einen Unterarm mit nach oben zeigender Handfläche auf den Oberschenkel, die Hand ragt über das Knie hinaus. Halte eine leichte Hantel fest in der Hand.',
    steps: ['Hantel langsam durch Beugen des Handgelenks nach unten absenken (Finger öffnen sich leicht).', 'Danach das Handgelenk Richtung Unterarm beugen und die Hantel anheben.', 'Oben kurz halten.', 'Nach dem Satz die Seite wechseln.'],
    breathing: 'Gleichmäßig ruhig weiteratmen.',
    execution: 'Langsames, kleines Bewegungsfeld. Der Unterarm bleibt auf dem Oberschenkel liegen. Dieser Satz bleibt auf allen Stufen bei einem Satz pro Seite.',
    mistakes: ['Unterarm hebt vom Oberschenkel ab', 'Zu schweres Gewicht', 'Zu schnelle, ruckartige Bewegung', 'Gewicht rutscht aus der Hand'],
    safety: ['Hantel sicher halten, keine ruckartigen Bewegungen.', 'Bei Schmerzen im Handgelenk oder Ellbogen sofort stoppen.'],
    weightGuide: 'Start mit 1 kg. Später typischerweise 2–6 kg.'
  }
};

const TRAININGS = {
  A: { id: 'A', name: 'Training A', focus: 'Bizeps · Trizeps · seitliche Schulter · Rücken', ex: ['curl', 'tri', 'lat', 'row'] },
  B: { id: 'B', name: 'Training B', focus: 'Bizeps · Unterarm · Brust · Schulter · oberer Rücken', ex: ['ham', 'push', 'press', 'rfly', 'wrist'] }
};

const TOLERANCE = {
  gut:    { label: 'Gut vertragen', sub: 'Kaum oder leichter Muskelkater' },
  mittel: { label: 'Deutlicher Muskelkater', sub: 'Spürbar, aber nach 2–3 Tagen weg' },
  stark:  { label: 'Starker Muskelkater', sub: 'Länger als 3 Tage oder sehr unangenehm' },
  schmerz:{ label: 'Schmerzen', sub: 'Gelenk-, Rücken- oder stechender Schmerz' }
};
