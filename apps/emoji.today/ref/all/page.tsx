import {
  RestaurantCardsContainer,
} from "../components/RestaurantCardsContainer";
import { getRestaurantsSortedByCheckins } from "../lib/common";

export const revalidate = 60 * 60; // revalidate every hour

export default async function Home() {
  const restaurants = await getRestaurantsSortedByCheckins();

  // const firstTenRestaurants = restaurants?.slice(0, 10)

  return (
    <div className="pb-14 sm:pb-32 pt-14">
      <RestaurantCardsContainer
        restaurants={restaurants}
        title="All restaurants"
        subtitle="Sorted by lifetime check ins"
      />
    </div>
  );
}
