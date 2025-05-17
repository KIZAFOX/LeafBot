const axios = require('axios');

module.exports = {
  name: 'pray',
  description: 'Affiche les horaires de prière pour une ville donnée.',
  async execute(message, args) {
    const city = args.join(' ').trim();
    if (!city) {
      return await message.reply('Veuillez spécifier une ville. Exemple : `-pray Paris`.');
    }

    try {
      const response = await axios.get(`http://api.aladhan.com/v1/timingsByCity`, {
        params: {
          city,
          country: 'FR',
          method: 2,
        },
      });

      if (response.data.code === 200 && response.data.data && response.data.data.timings) {
        const timings = response.data.data.timings;
        const reply =
          `Horaires de prière pour ${city} :

- Fajr : ${timings.Fajr}
- Dhuhr : ${timings.Dhuhr}
- Asr : ${timings.Asr}
- Maghrib : ${timings.Maghrib}
- Isha : ${timings.Isha}`;

        await message.reply(reply);
      } else {
        await message.reply(`Désolé, je n'ai pas pu trouver les horaires pour ${city}.`);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des horaires de prière :', error);
      await message.reply('Une erreur est survenue lors de la récupération des horaires de prière.');
    }
  },
};
