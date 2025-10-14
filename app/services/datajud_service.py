import httpx
from typing import Optional, Dict
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class DataJudService:
    """Service to interact with DataJud CNJ API"""

    def __init__(self):
        self.base_url = settings.DATAJUD_BASE_URL
        self.api_key = settings.DATAJUD_API_KEY
        self.headers = {
            "Authorization": f"APIKey {self.api_key}",
            "Content-Type": "application/json"
        }

    def fetch_process(
        self,
        process_number: str,
        tribunal_endpoint: str
    ) -> Optional[Dict]:
        """
        Fetch process data from DataJud API

        Args:
            process_number: Process number (e.g., "00008323520184013202")
            tribunal_endpoint: Endpoint path (e.g., "api_publica_trf1")

        Returns:
            Dict with process data or None if failed
        """
        try:
            url = f"{self.base_url}/{tribunal_endpoint}/_search"

            payload = {
                "query": {
                    "match": {
                        "numeroProcesso": process_number
                    }
                }
            }

            logger.info(f"Fetching process {process_number} from {url}")

            with httpx.Client(timeout=30.0) as client:
                response = client.post(url, json=payload, headers=self.headers)

                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Successfully fetched process {process_number}")
                    return data
                else:
                    logger.error(
                        f"Failed to fetch process {process_number}: "
                        f"Status {response.status_code}"
                    )
                    return None

        except Exception as e:
            logger.error(f"Error fetching process {process_number}: {str(e)}")
            return None

    def get_tribunal_endpoint(self, court_type: str, state: str) -> str:
        """
        Get the correct tribunal endpoint based on court type and state

        Args:
            court_type: Type of court (tj, trt, trf, etc.)
            state: State code (e.g., "SP", "RJ")

        Returns:
            Endpoint path
        """
        court_type = court_type.lower()

        # Tribunal de Justiça (State courts)
        if court_type == "tj":
            return f"api_publica_tj{state.lower()}"

        # Tribunal Regional do Trabalho
        elif court_type == "trt":
            # Map states to TRT regions (simplified)
            trt_map = {
                "RJ": "1", "SP": "2", "MG": "3", "RS": "4", "BA": "5",
                # Add more mappings as needed
            }
            region = trt_map.get(state.upper(), "1")
            return f"api_publica_trt{region}"

        # Tribunal Regional Federal
        elif court_type == "trf":
            # Map states to TRF regions (simplified)
            trf_map = {
                "RJ": "2", "SP": "3", "RS": "4", "BA": "1",
                # Add more mappings as needed
            }
            region = trf_map.get(state.upper(), "1")
            return f"api_publica_trf{region}"

        # Superior courts
        elif court_type == "tst":
            return "api_publica_tst"
        elif court_type == "tse":
            return "api_publica_tse"
        elif court_type == "stj":
            return "api_publica_stj"

        # Default
        return f"api_publica_tj{state.lower()}"
