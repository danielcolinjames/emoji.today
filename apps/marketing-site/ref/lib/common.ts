// import clientPromise from "@/lib/mongodb"
// import { SITE_DB_NAME } from "@/lib/utils"
// import { Restaurant } from "../components/RestaurantCardsContainer"
import { ignoredRestaurantIds } from './ignored'

export async function getCheckinCountsByRestaurant() {
  // const client = await clientPromise
  // const db = client.db(SITE_DB_NAME)

  // const checkinCounts = await db
  //   .collection("checkIns")
  //   .aggregate([
  //     {
  //       $group: {
  //         _id: "$restaurantId", // Group by restaurant_id
  //         totalCheckins: { $count: {} }, // Count the checkins per restaurant
  //       },
  //     },
  //     { $sort: { totalCheckins: -1 } }, // Sort by totalCheckins in descending order
  //   ])
  //   .toArray()

  // return checkinCounts
  return []
}

export async function getRestaurantsSortedByCheckins() {
  // const client = await clientPromise
  // const db = client.db(SITE_DB_NAME)

  // const checkinCounts = await getCheckinCountsByRestaurant()

  // // Map of restaurant_id to totalCheckins for quick lookup
  // const checkinMap = new Map(
  //   checkinCounts.map(({ _id, totalCheckins }) => [_id, totalCheckins])
  // )

  // // Fetch all restaurants
  // let allRestaurants = await db.collection("restaurants").find().toArray()

  // // Add totalCheckins to each restaurant from checkinMap
  // const restaurants = allRestaurants.map((restaurant) => ({
  //   restaurantId: restaurant.restaurantId,
  //   restaurantName: restaurant.restaurantName,
  //   accessLevels: restaurant.accessLevels || [],
  //   totalCheckins: checkinMap.get(restaurant.restaurantId) || 0,
  //   // Explicitly set or default any other required properties here
  // })) as Restaurant[]

  // const filteredRestaurants = restaurants.filter(
  //   (restaurant) => !ignoredRestaurantIds.includes(restaurant.restaurantId)
  // )

  // // Sort restaurants by totalCheckins
  // filteredRestaurants.sort((a, b) => b.totalCheckins - a.totalCheckins)

  // return filteredRestaurants
  return []
}
