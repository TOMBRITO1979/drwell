import httpx
from typing import Optional, Dict, List
from app.core.config import settings
import logging
from datetime import datetime

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

    def _normalize_process_number(self, process_number: str) -> str:
        """Remove formatting from process number"""
        return ''.join(filter(str.isdigit, process_number))

    async def fetch_process(
        self,
        process_number: str,
        tribunal_endpoint: str
    ) -> Optional[Dict]:
        """
        Fetch process data from DataJud API (async version)

        Args:
            process_number: Process number (e.g., "00008323520184013202")
            tribunal_endpoint: Endpoint path (e.g., "api_publica_trf1")

        Returns:
            Dict with process data or None if failed
        """
        try:
            url = f"{self.base_url}/{tribunal_endpoint}/_search"

            # Normalize process number
            normalized_number = self._normalize_process_number(process_number)

            payload = {
                "query": {
                    "match": {
                        "numeroProcesso": normalized_number
                    }
                }
            }

            logger.info(f"Fetching process {process_number} from {url}")

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload, headers=self.headers)

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

    def _parse_date(self, date_str: Optional[str]) -> datetime:
        """Parse date string to datetime object"""
        if not date_str:
            return datetime.now()

        try:
            # Try ISO format
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            try:
                # Try timestamp
                return datetime.fromtimestamp(int(date_str) / 1000)
            except:
                return datetime.now()

    def extract_movements(self, raw_data: Dict) -> List[Dict]:
        """
        Extract and normalize movements from raw API data

        Args:
            raw_data: Raw data from DataJud API

        Returns:
            List of normalized movements
        """
        movements = []

        try:
            hits = raw_data.get("hits", {}).get("hits", [])

            for hit in hits:
                source = hit.get("_source", {})
                process_movements = source.get("movimentos", [])

                for mov in process_movements:
                    movement = {
                        "movement_code": mov.get("codigoNacional"),
                        "movement_name": mov.get("nome", "Movimentação"),
                        "movement_date": self._parse_date(mov.get("dataHora")),
                        "description": mov.get("complemento") or mov.get("nome", ""),
                        "raw_data": mov
                    }
                    movements.append(movement)

            # Sort by date (most recent first)
            movements.sort(key=lambda x: x["movement_date"], reverse=True)

        except Exception as e:
            logger.error(f"Error extracting movements: {str(e)}")

        return movements

    async def get_process_movements(
        self,
        process_number: str,
        court_type: str,
        state: Optional[str] = None
    ) -> List[Dict]:
        """
        Get process movements from DataJud API

        Args:
            process_number: Process number
            court_type: Type of court
            state: State code

        Returns:
            List of movements
        """
        try:
            # Get tribunal endpoint
            tribunal_endpoint = self.get_tribunal_endpoint(court_type, state or "SP")

            # Fetch process data
            raw_data = await self.fetch_process(process_number, tribunal_endpoint)

            if not raw_data:
                logger.warning(f"No data found for process {process_number}")
                return []

            # Extract movements
            movements = self.extract_movements(raw_data)
            logger.info(f"Found {len(movements)} movements for process {process_number}")

            return movements

        except Exception as e:
            logger.error(f"Error getting movements for process {process_number}: {str(e)}")
            return []

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
