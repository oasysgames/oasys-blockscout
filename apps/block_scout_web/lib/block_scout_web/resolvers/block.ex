defmodule BlockScoutWeb.Resolvers.Block do
  @moduledoc false

  alias Explorer.{Chain, GraphQL, Repo}

  def get_by(_, %{number: number}, _) do
    case Chain.number_to_block(number) do
      {:ok, _} = result -> result
      {:error, :not_found} -> {:error, "Block number #{number} was not found."}
    end
  end

  def block_height(_, _) do
    Chain.block_height()
    |> case do
         :error ->
           {:error, "Something is wrong."}
         block_height ->
           {:ok, block_height}
       end
  end

  def list(_, %{page_number: _, page_size: _} = args, _) do
    GraphQL.block_list_query(args)
    |> Repo.all
    |> case do
         nil ->
           {:error, "Something is wrong."}
         blocks ->
           {:ok, blocks}
       end
  end
end
