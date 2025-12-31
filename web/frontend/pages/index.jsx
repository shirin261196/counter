import {
  Card,
  Page,
  Layout,
  TextContainer,
  Image,
  Stack,
  Link,
  Text,
  Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation, Trans } from "react-i18next";

import { trophyImage } from "../assets";

import { ProductsCard } from "../components";

export default function HomePage() {
  const { t } = useTranslation();
  const openTimers = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const shop = params.get("shop");
      const path = shop ? `/timers?shop=${encodeURIComponent(shop)}` : `/timers`;
      window.location.href = path;
    } catch (e) {
      // fallback
      window.location.href = "/timers";
    }
  };
  return (
    <Page narrowWidth>
      <TitleBar title={t("HomePage.title")} />
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack
              wrap={false}
              spacing="extraTight"
              distribution="trailing"
              alignment="center"
            >
              <Stack.Item fill>
                <TextContainer spacing="loose">
                  <Text as="h2" variant="headingMd">
                    {t("HomePage.heading")}
                  </Text>
                  <p>
                    <Trans
                      i18nKey="HomePage.yourAppIsReadyToExplore"
                      components={{
                        PolarisLink: (
                          <Link url="https://polaris.shopify.com/" external />
                        ),
                        AdminApiLink: (
                          <Link
                            url="https://shopify.dev/api/admin-graphql"
                            external
                          />
                        ),
                        AppBridgeLink: (
                          <Link
                            url="https://shopify.dev/apps/tools/app-bridge"
                            external
                          />
                        ),
                      }}
                    />
                  </p>
                  <p>{t("HomePage.startPopulatingYourApp")}</p>
                  <p>
                    <Trans
                      i18nKey="HomePage.learnMore"
                      components={{
                        ShopifyTutorialLink: (
                          <Link
                            url="https://shopify.dev/apps/getting-started/add-functionality"
                            external
                          />
                        ),
                      }}
                    />
                  </p>
                  <div style={{ marginTop: 12 }}>
                    <Button primary onClick={openTimers}>
                      Open Timers
                    </Button>
                  </div>
                </TextContainer>
              </Stack.Item>
              <Stack.Item>
                <div style={{ padding: "0 20px" }}>
                  <Image
                    source={trophyImage}
                    alt={t("HomePage.trophyAltText")}
                    width={120}
                  />
                </div>
              </Stack.Item>
            </Stack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <ProductsCard />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
