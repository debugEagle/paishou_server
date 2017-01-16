'use script'

const moment = require('moment')
const Sequelize = require('sequelize')
const lightco = require('lightco')
const logger = log4js.getLogger('routes-series')

const toInt = Utils.toInt
const webcache = Services.cache.webcache

const series = {}

const { Casinos,
        Cities,
        Countries,
        Currencies,
        Matches,
        MatchTypes,
        Series,
        SerieImages,
        Tours,          } = Models

series.hot = require('./hot')
series.players = require('./players')
series.payInfo = require('./payInfo')

//赛事日历
series.calendar = (req, res) => {
    lightco.run(function *($) {
        const S = Sequelize

        const DEF = Conf.const.series.calendar.limit_def
        const MAX = Conf.const.series.calendar.limit_max

        let query = [{publish_state: {$ne: 0}}]

        try {
            // 按月查询
            if (req.query.month) {
                const month = req.query.month
                const length = month.length
                if (length === 4) {
                  query.push(S.where(S.fn('PERIOD_DIFF',S.fn('DATE_FORMAT',S.col('startDate'),'%Y'),month),'=',0))
                }
                if (length === 6) {
                  query.push(S.where(S.fn('PERIOD_DIFF',S.fn('DATE_FORMAT',S.col('startDate'),'%Y%m'),month),'=',0))
                }
            }

            // 国家
            if (req.query.country) {
                var country = {name: req.query.country}
            }

            const include = [{
                model: Casinos,
                attributes: [],
                include: [{
                    model: Countries,
                    attributes: [
                        sequelize.literal('`casino.country`.`name` AS `country`'),
                    ],
                    where: country || {},
                }, {
                    model: Cities,
                    attributes: [
                        sequelize.literal('`casino.city`.`name` AS `city`'),
                    ],
                }],
            }]

            // 巡回赛查询
            if (req.query.tour) {
              var tour = {name: req.query.tour}

              include.push({
                model: Tours,
                attributes: [],
                where: tour || {}
              })
            }

            let opts = {
                include: include,
                order: [['start_date', req.query.order || 'ASC']],
                offset: toInt(req.query.offset, 0),
                limit: toInt(req.query.limit, DEF),
                where: {$and: query},
                raw: true,
            }

            opts.limit = opts.limit > MAX ? MAX : opts.limit

            var [err, result] = yield Series.scope('calendar').findAndCountAll(opts)
            if (err) throw err

            result.rows.forEach(function(item) {
                 delete item['casino.city.id']
                 delete item['casino.country.id']
            })


            yield webcache.set(req, JSON.stringify(result), $)

            return Handle.success(res, result)

        } catch (e) {
            logger.fatal(e)
            return Handle.error(res)
        }
    })
}

//热门赛事详情
series.isHotDetail = (req, res) => {
    lightco.run(function *($) {
        const id = req.params.id

        try {
            const opts = {
                include: [{
                    model: Matches,
                    attributes: [
                        'id',
                        'publishState',
                        'haveResult',
                        'isPromotion',
                        'name',
                        'matchDay',
                        'realBuyin',
                        'rakeBuyin',
                        'startTime',
                        'unitPrice',
                    ],
                    include: [{
                        model: MatchTypes,
                        attributes: ['name'],
                    }, {
                        model: Currencies,
                        attributes: ['name'],
                    }],
                    where: {isOneTicketMatch: 0},
                }],
                where: {id: id},
            }

            var [err, hotResult] = yield Series.scope('detail').findOne(opts)
            if (err) throw err

            hotResult.matches.forEach(function (item) {
                if (item.unitPrice === null) {
                    item.dataValues.state = 1
                }
                else if (item.publishState === 1) {
                    item.dataValues.state = 2
                }

                if (item.publishState === 2) {
                    item.dataValues.state = 3
                }

                if (item.publishState === 3) {
                    if (!item.haveResult) {
                        item.dataValues.state = 4
                    }
                    else {
                        if (item.isPromotion) {
                            item.dataValues.state = 5
                        }
                        else {
                            item.dataValues.state = 6
                        }
                    }
                }
            })

            if (hotResult.isOneTicket) {
                const oneTicketOpts = {
                    include: [{
                        model: MatchTypes,
                        attributes: ['name'],
                    }, {
                        model: Currencies,
                        attributes: ['name'],
                    }],
                    where: {
                        seriesId: hotResult.id,
                        isOneTicketMatch: 1,
                    },
                }

                var [err, oneTicketMatch] = yield Matches.scope('oneTicket').findOne(oneTicketOpts)
                if (err) throw err

                hotResult.dataValues.oneTicketInfo = oneTicketMatch
            }

            if (hotResult === null) {
                return Handle.error(res, '0', 403)
            }
            else {
                yield webcache.set(req, JSON.stringify(hotResult), $)

                return Handle.success(res, hotResult)
            }

        } catch (e) {
            logger.fatal(e)
            return Handle.error(res)
        }
    })
}

//非热门赛事详情
series.detail = (req, res) => {
    lightco.run(function *($) {
        const id = req.params.id

        try {
            const regularOpts = {
                include: [{
                  model: SerieImages,
                  attributes: [['image_url','url']],
                }, {
                  model: Casinos,
                  attributes: ['address'],
                }, {
                  model: Matches,
                  attributes: [
                      'id',
                      'publishState',
                      'name',
                      'matchDay',
                      'realBuyin',
                      'rakeBuyin',
                      'absDiscount',
                      'relDiscount',
                      'unitPrice',
                  ],
                  include: [{
                      model: Currencies,
                      attributes: ['name'],
                  }],
                }],
                where: {id: id},
                attributes: ['id','name','phone','website','isOneTicket'],
                order: ['matches.match_day'],
            }

            var [err, regularResult] = yield Series.findOne(regularOpts)
            if (err) throw err

            if (regularResult === null) {
                return Handle.success(res, 0, 204)
            }
            else {
                yield webcache.set(req, JSON.stringify(regularResult), $)

                return Handle.success(res, regularResult)
            }
        } catch (e) {
            logger.fatal(e)
            return Handle.error(res)
        }
    })
}


module.exports = series
