export class GoogleMapsClient {
  apiKey: string;

  constructor({ apiKey }: { apiKey: string }) {
    this.apiKey = apiKey;
  }

  public async getPlace(textQuery: string) {
    const endpoint = 'https://places.googleapis.com/v1/places:searchText';

    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': this.apiKey,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress',
    };

    const body = {
      textQuery,
      languageCode: 'ja-JP',
      regionCode: 'jp',
    };

    const result = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const json = await result.json();
    return json;
  }

  public async getRoute(origin: string, destination: string) {
    const endpoint =
      'https://routes.googleapis.com/directions/v2:computeRoutes';

    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': this.apiKey,
      'X-Goog-FieldMask':
        'routes.legs.steps.navigationInstruction,routes.legs.steps.localizedValues,routes.legs.steps.startLocation,routes.legs.steps.endLocation',
      // 'X-Goog-FieldMask':
      //   'routes.legs.steps.navigationInstruction,routes.legs.steps.localizedValues',
    };

    const body = {
      origin: {
        address: origin,
        vehicleStopover: true,
      },
      destination: {
        address: destination,
        vehicleStopover: true,
      },
      intermediates: [],
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      // "departureTime": "",
      // "arrivalTime": "",
      // "computeAlternativeRoutes": false,
      // extraComputations: ['TOLLS'],
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: true,
        // vehicleInfo: {
        //   emissionType: 'GASOLINE',
        // },
      },
      languageCode: 'ja-JP',
      regionCode: 'jp',
      units: 'METRIC',
      optimizeWaypointOrder: false,
    };

    const result = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const json = await result.json();
    return json;
  }
}
