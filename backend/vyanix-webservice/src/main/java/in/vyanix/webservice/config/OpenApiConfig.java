package in.vyanix.webservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI vyanixOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Vyanix E-commerce API")
                        .description("Vyanix E-commerce Platform REST API")
                        .version("1.0.0")
                        .license(new License().name("MIT").url("https://opensource.org/licenses/MIT")));
    }
}
