
module.exports = (db) => {
	/* 顺序应按照先主表 后从表的顺序排列 */
	return {
		Users: require('./users')(db),
		Matches: require('./matches')(db),
		MatchTypes: require('./match_types')(db),
		Currencies: require('./currencies')(db),
		Series: require('./series')(db),
		SerieImages: require('./serie_images')(db),
		Tours: require('./tours')(db),
		Organizers: require('./organizers')(db),
		Casinos: require('./casinos')(db),
		Countries: require('./countries')(db),
		Cities: require('./cities')(db),
		PromotionResults: require('./promotion_results')(db),
		Players: require('./players')(db),
		MatchResults: require('./match_results')(db),
		Orders: require('./orders')(db),
	}
}
